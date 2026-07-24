from __future__ import annotations

import argparse
import gzip
import json
import re
import sys
import unicodedata
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_SOURCE = SCRIPT_DIR / "data" / "ja-extract.jsonl.gz"
DEFAULT_OUTPUT = SCRIPT_DIR / "output" / "ja-readings.json"
LEADING_GLOSS_READING = re.compile(r"^\uff08([^\uff09]*)\uff09")
GLOSS_READING_SEPARATOR = re.compile(r"[\u3001,\uff0c]")
ROMAJI_READING = re.compile(r"^[A-Za-z'’\-\s]+$")
GLOSS_FALLBACK_EXCLUDED_PARTS_OF_SPEECH = {
    "character",
    "name",
    "proper noun",
    "proper-noun",
}


def normalize(text: str) -> str:
    """Normalize text for stable dictionary lookups."""
    return unicodedata.normalize("NFC", text).strip().casefold()


def as_string_list(value: Any) -> list[str]:
    if value is None:
        return []

    if isinstance(value, str):
        return [value]

    if isinstance(value, list):
        return [
            str(item)
            for item in value
            if item is not None
        ]

    return [str(value)]


def read_tags(value: dict[str, Any]) -> set[str]:
    tags = set(as_string_list(value.get("tags")))
    tags.update(as_string_list(value.get("raw_tags")))

    return {
        normalize(tag).replace("_", "-")
        for tag in tags
        if tag.strip()
    }


def contains_kanji(text: str) -> bool:
    """Return True when the text contains at least one kanji character."""
    return any(
        "\u3400" <= character <= "\u4dbf"
        or "\u4e00" <= character <= "\u9fff"
        or "\uf900" <= character <= "\ufaff"
        for character in text
    )


def detect_japanese_script(text: str) -> str:
    """
    Detect whether a reading is written in hiragana or katakana.

    Long-vowel and separator characters are ignored when classifying.
    """
    ignored_characters = {
        "・",
        "ー",
        "〜",
        "～",
        " ",
    }

    characters = [
        character
        for character in text
        if character not in ignored_characters
    ]

    if not characters:
        return "unknown"

    if all(
        "\u3040" <= character <= "\u309f"
        for character in characters
    ):
        return "hiragana"

    if all(
        "\u30a0" <= character <= "\u30ff"
        for character in characters
    ):
        return "katakana"

    return "mixed"


def detect_reading_type(tags: set[str]) -> str:
    """Classify a reading as kun, on or unknown from Kaikki tags."""
    if (
        "kun" in tags
        or any(tag.startswith("kun-") for tag in tags)
    ):
        return "kun"

    if (
        "on" in tags
        or any(tag.endswith("-on") for tag in tags)
    ):
        return "on"

    return "unknown"


def normalize_romaji(value: Any) -> str | None:
    """Return a structured Latin-script romanization or None."""
    if not isinstance(value, str):
        return None

    candidate = unicodedata.normalize("NFC", value).strip()
    return candidate if candidate and ROMAJI_READING.fullmatch(candidate) else None


def find_structured_romaji(
    forms: list[dict[str, Any]],
    reading_index: int,
) -> str | None:
    """
    Find romaji explicitly paired with a kana form in Kaikki data.

    A direct `roman` value wins. Otherwise, Kaikki commonly places the
    Latin transliteration immediately after its kana form; searching stops
    at the next kana form so unrelated readings are never paired.
    """
    direct = normalize_romaji(forms[reading_index].get("roman"))
    if direct:
        return direct

    for candidate in forms[reading_index + 1:]:
        candidate_text = candidate.get("form")
        if not isinstance(candidate_text, str):
            continue
        if detect_japanese_script(candidate_text.strip()) in {"hiragana", "katakana"}:
            break

        tags = read_tags(candidate)
        romanization = normalize_romaji(candidate_text)
        if romanization and (
            "romanization" in tags
            or "romanisation" in tags
            or "transliteration" in tags
        ):
            return romanization

    return None


def detect_gloss_reading_script(text: str) -> str:
    """
    Validate a gloss-derived reading and return its kana script.

    Gloss fallback is deliberately stricter than structured Kaikki forms:
    only kana and the Japanese prolonged sound mark are accepted.
    """
    normalized_text = unicodedata.normalize("NFC", text)
    if not normalized_text:
        return "unknown"

    has_hiragana = False
    has_katakana = False

    for character in normalized_text:
        if (
            "\u3041" <= character <= "\u3096"
            or "\u3099" <= character <= "\u309f"
        ):
            has_hiragana = True
            continue

        if (
            "\u30a1" <= character <= "\u30fa"
            or "\u30fd" <= character <= "\u30ff"
        ):
            has_katakana = True
            continue

        if character == "\u30fc":
            continue

        return "unknown"

    if has_hiragana and not has_katakana:
        return "hiragana"

    if has_katakana and not has_hiragana:
        return "katakana"

    return "unknown"


def extract_gloss_readings(
    entry: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Extract conservative fallback readings from leading gloss parentheses.

    Kaikki sense order and candidate order are retained. These readings have
    no inferred kun/on or register semantics.
    """
    part_of_speech = normalize(str(entry.get("pos", "")))
    if part_of_speech in GLOSS_FALLBACK_EXCLUDED_PARTS_OF_SPEECH:
        return []

    raw_senses = entry.get("senses")
    if not isinstance(raw_senses, list):
        return []

    readings: list[dict[str, Any]] = []

    for raw_sense in raw_senses:
        if not isinstance(raw_sense, dict):
            continue

        raw_glosses = raw_sense.get("glosses")
        if not isinstance(raw_glosses, list):
            continue

        for raw_gloss in raw_glosses:
            if not isinstance(raw_gloss, str):
                continue

            normalized_gloss = unicodedata.normalize("NFC", raw_gloss)
            match = LEADING_GLOSS_READING.match(normalized_gloss)
            if match is None:
                continue

            for raw_candidate in GLOSS_READING_SEPARATOR.split(match.group(1)):
                candidate = unicodedata.normalize("NFC", raw_candidate.strip())
                script = detect_gloss_reading_script(candidate)
                if script not in {"hiragana", "katakana"}:
                    continue

                readings.append(
                    {
                        "text": candidate,
                        "type": "unknown",
                        "script": script,
                        "source": "gloss",
                        "confidence": "fallback",
                        "tags": [],
                    }
                )

    return deduplicate_readings(readings)


def deduplicate_readings(
    readings: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Merge duplicate readings while preserving all grammatical/source tags.
    """
    merged: dict[
        tuple[str, str],
        dict[str, Any],
    ] = {}

    for reading in readings:
        key = (
            normalize(reading["text"]),
            reading["type"],
        )

        if key not in merged:
            merged[key] = {
                "text": reading["text"],
                "type": reading["type"],
                "script": reading["script"],
                "source": reading["source"],
                "confidence": reading["confidence"],
                "romanization": reading.get("romanization"),
                "tags": set(reading["tags"]),
            }
            continue

        merged[key]["tags"].update(reading["tags"])
        if not merged[key].get("romanization") and reading.get("romanization"):
            merged[key]["romanization"] = reading["romanization"]

    result: list[dict[str, Any]] = []

    for reading in merged.values():
        compact_reading = {
                "text": reading["text"],
                "type": reading["type"],
                "script": reading["script"],
                "source": reading["source"],
                "confidence": reading["confidence"],
                "tags": sorted(reading["tags"]),
            }
        if reading.get("romanization"):
            compact_reading["romanization"] = reading["romanization"]
        result.append(compact_reading)

    # Fallback readings retain Kaikki sense/candidate order. Structured forms
    # keep the builder's established kun/on ordering.
    if result and all(
        reading["source"] == "gloss"
        for reading in result
    ):
        return result

    reading_type_order = {
        "kun": 0,
        "on": 1,
        "unknown": 2,
    }

    return sorted(
        result,
        key=lambda item: (
            reading_type_order.get(item["type"], 99),
            item["script"] != "hiragana",
        ),
    )


def build_compact_entry(
    entry: dict[str, Any],
    allowed_parts_of_speech: set[str],
) -> dict[str, Any] | None:
    if entry.get("lang_code") != "ja":
        return None

    word = entry.get("word")
    part_of_speech = entry.get("pos")

    if not isinstance(word, str) or not word.strip():
        return None

    word = word.strip()

    # Kana-only words do not need a separate kanji-reading lookup.
    if not contains_kanji(word):
        return None

    if not isinstance(part_of_speech, str):
        return None

    if (
        allowed_parts_of_speech
        and part_of_speech not in allowed_parts_of_speech
    ):
        return None

    raw_forms = entry.get("forms")
    forms = [
        raw_form
        for raw_form in (raw_forms if isinstance(raw_forms, list) else [])
        if isinstance(raw_form, dict)
    ]

    readings: list[dict[str, Any]] = []

    for form_index, raw_form in enumerate(forms):
        reading_text = raw_form.get("form")

        if (
            not isinstance(reading_text, str)
            or not reading_text.strip()
            or reading_text == "-"
        ):
            continue

        reading_text = reading_text.strip()
        tags = read_tags(raw_form)
        script = detect_japanese_script(reading_text)

        # Kaikki marked the readings from our test as transliterations.
        if "transliteration" not in tags:
            continue

        # Ignore romaji or mixed values for now.
        if script not in {"hiragana", "katakana"}:
            continue

        readings.append(
            {
                "text": reading_text,
                "type": detect_reading_type(tags),
                "script": script,
                "source": "forms",
                "confidence": "structured",
                "romanization": find_structured_romaji(forms, form_index),
                "tags": sorted(tags),
            }
        )

    readings = deduplicate_readings(readings)

    if not readings:
        readings = extract_gloss_readings(entry)

    if not readings:
        return None

    return {
        "word": word,
        "partOfSpeech": part_of_speech,
        "readings": readings,
    }


def deduplicate_entries(
    entries: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    deduplicated: list[dict[str, Any]] = []
    seen: set[str] = set()

    for entry in entries:
        signature = json.dumps(
            entry,
            ensure_ascii=False,
            sort_keys=True,
        )

        if signature in seen:
            continue

        seen.add(signature)
        deduplicated.append(entry)

    return sorted(
        deduplicated,
        key=lambda item: (
            item["partOfSpeech"],
            normalize(item["word"]),
        ),
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Build a compact Japanese kanji-reading index "
            "from a Kaikki JSONL.GZ file."
        )
    )

    parser.add_argument(
        "--source",
        type=Path,
        default=DEFAULT_SOURCE,
        help=f"Kaikki source file. Default: {DEFAULT_SOURCE}",
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Generated JSON index. Default: {DEFAULT_OUTPUT}",
    )

    parser.add_argument(
        "--pos",
        nargs="+",
        default=[],
        help=(
            "Optional parts of speech to retain, "
            "for example: --pos noun verb adj"
        ),
    )

    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Write indented JSON. Larger but easier to inspect.",
    )

    parser.add_argument(
        "--show",
        nargs="*",
        default=[],
        help='Print selected entries, for example: --show "冬"',
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    source = args.source.resolve()
    output = args.output.resolve()

    allowed_parts_of_speech = {
        normalize(part_of_speech)
        for part_of_speech in args.pos
    }

    if not source.exists():
        print(
            f"Source file not found:\n{source}",
            file=sys.stderr,
        )
        return 1

    index: defaultdict[
        str,
        list[dict[str, Any]],
    ] = defaultdict(list)

    processed_lines = 0
    retained_entries = 0

    print(f"Reading: {source}")
    print("Language: ja")
    print("Profile: Japanese kanji readings")
    print(
        "Parts of speech: "
        + (
            ", ".join(sorted(allowed_parts_of_speech))
            if allowed_parts_of_speech
            else "all"
        )
    )

    try:
        with gzip.open(
            source,
            mode="rt",
            encoding="utf-8",
        ) as handle:
            for processed_lines, line in enumerate(
                handle,
                start=1,
            ):
                if processed_lines % 100_000 == 0:
                    print(
                        f"  Processed {processed_lines:,} lines; "
                        f"kept {retained_entries:,} entries..."
                    )

                line = line.strip()

                if not line:
                    continue

                try:
                    raw_entry = json.loads(line)
                except json.JSONDecodeError as error:
                    print(
                        (
                            "Skipping invalid JSON on line "
                            f"{processed_lines}: {error}"
                        ),
                        file=sys.stderr,
                    )
                    continue

                if not isinstance(raw_entry, dict):
                    continue

                compact_entry = build_compact_entry(
                    raw_entry,
                    allowed_parts_of_speech,
                )

                if compact_entry is None:
                    continue

                key = normalize(compact_entry["word"])
                index[key].append(compact_entry)
                retained_entries += 1

    except (OSError, UnicodeError) as error:
        print(
            f"Could not read source file: {error}",
            file=sys.stderr,
        )
        return 1

    final_entries = {
        key: deduplicate_entries(entries)
        for key, entries in sorted(index.items())
    }

    payload = {
        "schemaVersion": 1,
        "language": "ja",
        "profile": "japanese-readings",
        "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
        "source": "Kaikki.org / Wiktionary",
        "partsOfSpeech": sorted(allowed_parts_of_speech),
        "entryCount": len(final_entries),
        "entries": final_entries,
    }

    output.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with output.open(
        "w",
        encoding="utf-8",
        newline="\n",
    ) as handle:
        if args.pretty:
            json.dump(
                payload,
                handle,
                ensure_ascii=False,
                indent=2,
            )
        else:
            json.dump(
                payload,
                handle,
                ensure_ascii=False,
                separators=(",", ":"),
            )

        handle.write("\n")

    output_size_mb = output.stat().st_size / (1024 * 1024)

    print("\nDone.")
    print(f"Processed lines: {processed_lines:,}")
    print(f"Retained raw entries: {retained_entries:,}")
    print(f"Lookup keys: {len(final_entries):,}")
    print(f"Output: {output}")
    print(f"Output size: {output_size_mb:.2f} MB")

    for requested_word in args.show:
        key = normalize(requested_word)

        print(f"\n{requested_word}:")

        if key not in final_entries:
            print("  No generated entry.")
            continue

        print(
            json.dumps(
                final_entries[key],
                ensure_ascii=False,
                indent=2,
            )
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
