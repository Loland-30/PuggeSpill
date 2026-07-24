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

DEFAULT_SOURCE = SCRIPT_DIR / "data" / "ko-extract.jsonl.gz"
DEFAULT_OUTPUT = SCRIPT_DIR / "output" / "ko-romanizations.json"

ROMANIZATION_TAGS = {
    "romanization",
    "romanisation",
    "transliteration",
    "revised romanization",
    "revised-romanization",
    "revised romanisation",
    "revised-romanisation",
    "rr",
    "mccune-reischauer",
    "mccune reischauer",
}

ALLOWED_ROMANIZATION_CHARACTERS = re.compile(
    r"^[A-Za-zÀ-ÖØ-öø-ÿĀ-ž'’\-.\s]+$"
)


def normalize(text: str) -> str:
    """Normalize text for stable dictionary lookups and tag comparisons."""
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


def contains_hangul(text: str) -> bool:
    """Return True when text contains Hangul syllables or Hangul Jamo."""
    return any(
        "\u1100" <= character <= "\u11ff"  # Hangul Jamo
        or "\u3130" <= character <= "\u318f"  # Compatibility Jamo
        or "\ua960" <= character <= "\ua97f"  # Extended-A
        or "\uac00" <= character <= "\ud7af"  # Hangul syllables
        or "\ud7b0" <= character <= "\ud7ff"  # Extended-B
        for character in text
    )


def contains_latin_letter(text: str) -> bool:
    """Return True when text contains at least one Latin letter."""
    for character in text:
        name = unicodedata.name(character, "")

        if "LATIN" in name and character.isalpha():
            return True

    return False


def is_valid_romanization(text: str) -> bool:
    """
    Accept ordinary Latin-script romanizations.

    Reject Hangul, digits, IPA-heavy values and unrelated punctuation.
    """
    candidate = unicodedata.normalize("NFC", text).strip()

    if not candidate:
        return False

    if contains_hangul(candidate):
        return False

    if not contains_latin_letter(candidate):
        return False

    return ALLOWED_ROMANIZATION_CHARACTERS.fullmatch(candidate) is not None


def is_romanization_form(tags: set[str]) -> bool:
    """Return True when Kaikki tags identify a form as romanized text."""
    for tag in tags:
        if tag in ROMANIZATION_TAGS:
            return True

        if "romanization" in tag or "romanisation" in tag:
            return True

        if "transliteration" in tag:
            return True

    return False


def detect_romanization_system(tags: set[str]) -> str | None:
    """Detect a named Korean romanization system when the source tags provide it."""
    normalized_tags = {
        tag.replace("_", "-")
        for tag in tags
    }

    if any(
        tag in {
            "revised romanization",
            "revised-romanization",
            "revised romanisation",
            "revised-romanisation",
            "rr",
        }
        for tag in normalized_tags
    ):
        return "revised-romanization"

    if any(
        "mccune" in tag and "reischauer" in tag
        for tag in normalized_tags
    ):
        return "mccune-reischauer"

    return None


def deduplicate_romanizations(
    romanizations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Merge duplicate romanizations while preserving tags and system metadata.
    """
    merged: dict[
        tuple[str, str | None],
        dict[str, Any],
    ] = {}

    for romanization in romanizations:
        key = (
            normalize(romanization["text"]),
            romanization.get("system"),
        )

        if key not in merged:
            merged[key] = {
                "text": romanization["text"],
                "system": romanization.get("system"),
                "source": romanization["source"],
                "confidence": romanization["confidence"],
                "tags": set(romanization["tags"]),
            }
            continue

        merged[key]["tags"].update(romanization["tags"])

    result: list[dict[str, Any]] = []

    for romanization in merged.values():
        result.append(
            {
                "text": romanization["text"],
                "system": romanization["system"],
                "source": romanization["source"],
                "confidence": romanization["confidence"],
                "tags": sorted(romanization["tags"]),
            }
        )

    system_order = {
        "revised-romanization": 0,
        "mccune-reischauer": 1,
        None: 2,
    }

    return sorted(
        result,
        key=lambda item: (
            system_order.get(item.get("system"), 99),
            normalize(item["text"]),
        ),
    )

def prefer_pronunciation_romanizations(
    romanizations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Prefer pronunciation-oriented Revised Romanization.

    Transliteration is retained only when no non-transliteration
    Revised Romanization exists for the entry.
    """
    preferred = [
        romanization
        for romanization in romanizations
        if "transliteration" not in romanization.get("tags", [])
    ]

    if preferred:
        return preferred

    return romanizations

def build_compact_entry(
    entry: dict[str, Any],
    allowed_parts_of_speech: set[str],
) -> dict[str, Any] | None:
    if entry.get("lang_code") != "ko":
        return None

    word = entry.get("word")
    part_of_speech = entry.get("pos")

    if not isinstance(word, str) or not word.strip():
        return None

    word = unicodedata.normalize("NFC", word).strip()

    if not contains_hangul(word):
        return None

    if not isinstance(part_of_speech, str):
        return None

    normalized_part_of_speech = normalize(part_of_speech)

    if (
        allowed_parts_of_speech
        and normalized_part_of_speech not in allowed_parts_of_speech
    ):
        return None

    raw_sounds = entry.get("sounds")

    if not isinstance(raw_sounds, list):
        raw_sounds = []

    romanizations: list[dict[str, Any]] = []

    for raw_sound in raw_sounds:
        if not isinstance(raw_sound, dict):
            continue

        roman_text = raw_sound.get("roman")

        if not isinstance(roman_text, str) or not roman_text.strip():
            continue

        tags = read_tags(raw_sound)

        if "romanization" not in tags:
            continue

        if "revised" not in tags:
            continue

        roman_text = unicodedata.normalize("NFC", roman_text).strip()

        if not is_valid_romanization(roman_text):
            continue

        romanizations.append(
            {
                "text": roman_text,
                "system": "revised-romanization",
                "source": "sounds",
                "confidence": "structured",
                "tags": sorted(tags),
            }
        )

    romanizations = deduplicate_romanizations(romanizations)
    romanizations = prefer_pronunciation_romanizations(romanizations)

    if not romanizations:
        return None

    return {
        "word": word,
        "partOfSpeech": normalized_part_of_speech,
        "romanizations": romanizations,
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
            "Build a compact Korean Hangul-to-romanization index "
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
        help='Print selected generated entries, for example: --show "먹다" "학교"',
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
    print("Language: ko")
    print("Profile: Korean romanizations")
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
            for processed_lines, line in enumerate(handle, start=1):
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
        "language": "ko",
        "profile": "korean-romanizations",
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
