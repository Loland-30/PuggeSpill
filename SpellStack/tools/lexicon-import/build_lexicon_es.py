from __future__ import annotations

import argparse
import gzip
import json
import sys
import unicodedata
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_SOURCE = SCRIPT_DIR / "data" / "es-extract.jsonl.gz"
DEFAULT_OUTPUT = SCRIPT_DIR / "output" / "es-morphology.json"

SUPPORTED_BASE_GENDER_INFERENCE = {"es", "fr", "pt"}
GENDER_TAGS = ("masculine", "feminine", "common-gender", "neuter")
NUMBER_TAGS = ("singular", "plural")


def normalize(text: str) -> str:
    """Normalize a word for stable dictionary lookups."""
    return unicodedata.normalize("NFC", text).strip().casefold()


def as_string_list(value: Any) -> list[str]:
    if value is None:
        return []

    if isinstance(value, str):
        return [value]

    if isinstance(value, list):
        return [str(item) for item in value if item is not None]

    return [str(value)]


def read_tags(value: dict[str, Any]) -> set[str]:
    tags = set(as_string_list(value.get("tags")))
    tags.update(as_string_list(value.get("raw_tags")))
    return {normalize(tag).replace("_", "-") for tag in tags if tag.strip()}


def pick_tag(tags: set[str], candidates: tuple[str, ...]) -> str | None:
    for candidate in candidates:
        if candidate in tags:
            return candidate

    return None


def build_variant(
    text: str,
    tags: set[str],
    *,
    inferred_gender: str | None = None,
    inferred_number: str | None = None,
) -> dict[str, Any]:
    gender = pick_tag(tags, GENDER_TAGS) or inferred_gender
    number = pick_tag(tags, NUMBER_TAGS) or inferred_number

    return {
        "text": text,
        "gender": gender,
        "number": number,
        "inferred": bool(inferred_gender or inferred_number),
    }


def deduplicate_variants(variants: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduplicated: list[dict[str, Any]] = []
    seen: set[tuple[str, str | None, str | None]] = set()

    for variant in variants:
        key = (
            normalize(variant["text"]),
            variant.get("gender"),
            variant.get("number"),
        )

        if key in seen:
            continue

        seen.add(key)
        deduplicated.append(variant)

    return sorted(
        deduplicated,
        key=lambda item: (
            item.get("number") == "plural",
            item.get("gender") == "feminine",
            normalize(item["text"]),
        ),
    )


def build_compact_entry(
    entry: dict[str, Any],
    *,
    language: str,
    allowed_parts_of_speech: set[str],
    include_plural: bool,
) -> dict[str, Any] | None:
    if entry.get("lang_code") != language:
        return None

    word = entry.get("word")
    part_of_speech = entry.get("pos")

    if not isinstance(word, str) or not word.strip():
        return None

    if not isinstance(part_of_speech, str):
        return None

    if allowed_parts_of_speech and part_of_speech not in allowed_parts_of_speech:
        return None

    entry_tags = read_tags(entry)
    raw_forms = entry.get("forms")

    if not isinstance(raw_forms, list):
        raw_forms = []

    parsed_forms: list[tuple[str, set[str]]] = []

    for raw_form in raw_forms:
        if not isinstance(raw_form, dict):
            continue

        form_text = raw_form.get("form")

        if not isinstance(form_text, str) or not form_text.strip() or form_text == "-":
            continue

        form_tags = read_tags(raw_form)

        if not include_plural and "plural" in form_tags:
            continue

        parsed_forms.append((form_text.strip(), form_tags))

    has_feminine_form = any(
        "feminine" in tags and "plural" not in tags
        for _, tags in parsed_forms
    )
    has_masculine_form = any(
        "masculine" in tags and "plural" not in tags
        for _, tags in parsed_forms
    )
    entry_gender = pick_tag(entry_tags, GENDER_TAGS)

    # Only retain entries that can actually enrich a translation with gender data.
    if not has_feminine_form and not has_masculine_form and entry_gender is None:
        return None

    variants: list[dict[str, Any]] = []

    base_gender = entry_gender
    base_number = pick_tag(entry_tags, NUMBER_TAGS)
    inferred_base_gender: str | None = None
    inferred_base_number: str | None = None

    # Spanish, French and Portuguese dictionaries normally use the masculine
    # singular adjective as the headword when a separate feminine form exists.
    if (
        language in SUPPORTED_BASE_GENDER_INFERENCE
        and part_of_speech == "adj"
        and base_gender is None
        and has_feminine_form
    ):
        inferred_base_gender = "masculine"

    if part_of_speech == "adj" and base_number is None:
        inferred_base_number = "singular"

    variants.append(
        build_variant(
            word.strip(),
            entry_tags,
            inferred_gender=inferred_base_gender,
            inferred_number=inferred_base_number,
        )
    )

    base_is_masculine = (
        base_gender == "masculine" or inferred_base_gender == "masculine"
    )

    for form_text, form_tags in parsed_forms:
        inferred_gender: str | None = None
        inferred_number: str | None = None

        if "feminine" in form_tags and "plural" not in form_tags:
            inferred_number = "singular"

        if "plural" in form_tags and not any(
            gender_tag in form_tags for gender_tag in GENDER_TAGS
        ):
            if base_is_masculine:
                inferred_gender = "masculine"

        variants.append(
            build_variant(
                form_text,
                form_tags,
                inferred_gender=inferred_gender,
                inferred_number=inferred_number,
            )
        )

    variants = deduplicate_variants(variants)

    # An entry with only the original word does not add anything useful.
    if len(variants) < 2:
        return None

    return {
        "word": word.strip(),
        "partOfSpeech": part_of_speech,
        "variants": variants,
    }


def deduplicate_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduplicated: list[dict[str, Any]] = []
    seen: set[str] = set()

    for entry in entries:
        signature = json.dumps(entry, ensure_ascii=False, sort_keys=True)

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
            "Build a compact gender/morphology index from a Kaikki JSONL.GZ file."
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
        "--lang",
        default="es",
        help="Kaikki ISO language code. Default: es",
    )

    parser.add_argument(
        "--pos",
        nargs="+",
        default=["adj"],
        help="Parts of speech to retain. Default: adj",
    )

    parser.add_argument(
        "--include-plural",
        action="store_true",
        help="Also retain plural forms.",
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
        help="Print selected generated entries, e.g. --show cansado simpático",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = args.source.resolve()
    output = args.output.resolve()
    language = normalize(args.lang)
    allowed_parts_of_speech = {normalize(pos) for pos in args.pos}

    if not source.exists():
        print(f"Source file not found:\n{source}", file=sys.stderr)
        return 1

    index: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    processed_lines = 0
    retained_entries = 0

    print(f"Reading: {source}")
    print(f"Language: {language}")
    print(f"Parts of speech: {', '.join(sorted(allowed_parts_of_speech))}")
    print(f"Include plural: {'yes' if args.include_plural else 'no'}")

    try:
        with gzip.open(source, mode="rt", encoding="utf-8") as handle:
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
                        f"Skipping invalid JSON on line {processed_lines}: {error}",
                        file=sys.stderr,
                    )
                    continue

                if not isinstance(raw_entry, dict):
                    continue

                compact_entry = build_compact_entry(
                    raw_entry,
                    language=language,
                    allowed_parts_of_speech=allowed_parts_of_speech,
                    include_plural=args.include_plural,
                )

                if compact_entry is None:
                    continue

                key = normalize(compact_entry["word"])
                index[key].append(compact_entry)
                retained_entries += 1

    except (OSError, UnicodeError) as error:
        print(f"Could not read source file: {error}", file=sys.stderr)
        return 1

    final_entries = {
        key: deduplicate_entries(entries)
        for key, entries in sorted(index.items())
    }

    payload = {
        "schemaVersion": 1,
        "language": language,
        "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
        "source": "Kaikki.org / Wiktionary",
        "partsOfSpeech": sorted(allowed_parts_of_speech),
        "includesPlural": args.include_plural,
        "entryCount": len(final_entries),
        "entries": final_entries,
    }

    output.parent.mkdir(parents=True, exist_ok=True)

    with output.open("w", encoding="utf-8", newline="\n") as handle:
        if args.pretty:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
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
