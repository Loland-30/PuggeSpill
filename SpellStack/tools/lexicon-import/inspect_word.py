from __future__ import annotations

import argparse
import gzip
import json
import sys
import unicodedata
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_FILE = SCRIPT_DIR / "data" / "es-extract.jsonl.gz"


def normalize(text: str) -> str:
    """Normaliserer tekst slik at store/små bokstaver og Unicode sammenlignes trygt."""
    return unicodedata.normalize("NFC", text).strip().casefold()


def format_tags(form: dict[str, Any]) -> str:
    tags = form.get("tags") or form.get("raw_tags") or []

    if isinstance(tags, str):
        tags = [tags]

    return ", ".join(str(tag) for tag in tags) if tags else "ingen tags"


def print_entry(entry: dict[str, Any], show_raw: bool) -> None:
    word = entry.get("word", "ukjent")
    language = entry.get("lang", entry.get("lang_code", "ukjent"))
    part_of_speech = entry.get("pos", "ukjent")

    print("\n" + "=" * 70)
    print(f"Ord:       {word}")
    print(f"Språk:     {language}")
    print(f"Ordklasse: {part_of_speech}")

    senses = entry.get("senses") or []

    if senses:
        print("\nBetydninger:")

        for sense in senses[:5]:
            glosses = sense.get("glosses") or []

            for gloss in glosses:
                print(f"  - {gloss}")

    forms = entry.get("forms") or []

    if forms:
        print("\nFormer:")

        seen: set[tuple[str, str]] = set()

        for form_data in forms:
            form = str(form_data.get("form", "")).strip()

            if not form or form == "-":
                continue

            tags = format_tags(form_data)
            key = (normalize(form), tags)

            if key in seen:
                continue

            seen.add(key)
            print(f"  - {form:<25} [{tags}]")
    else:
        print("\nIngen former funnet på denne oppføringen.")

    if show_raw:
        print("\nRå JSON:")
        print(json.dumps(entry, ensure_ascii=False, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Slå opp et ord i en komprimert Kaikki JSONL-fil."
    )

    parser.add_argument(
        "word",
        help="Ordet som skal slås opp, for eksempel cansado.",
    )

    parser.add_argument(
        "--file",
        type=Path,
        default=DEFAULT_DATA_FILE,
        help=f"Sti til Kaikki-filen. Standard: {DEFAULT_DATA_FILE}",
    )

    parser.add_argument(
        "--lang",
        default="es",
        help="ISO-språkkode. Standard: es",
    )

    parser.add_argument(
        "--raw",
        action="store_true",
        help="Vis også hele JSON-oppføringen.",
    )

    args = parser.parse_args()

    if not args.file.exists():
        print(f"Fant ikke datafilen:\n{args.file}", file=sys.stderr)
        return 1

    target = normalize(args.word)
    matches = 0

    print(f"Søker etter «{args.word}» i {args.file.name} ...")

    try:
        with gzip.open(args.file, mode="rt", encoding="utf-8") as file:
            for line_number, line in enumerate(file, start=1):
                line = line.strip()

                if not line:
                    continue

                try:
                    entry = json.loads(line)
                except json.JSONDecodeError as error:
                    print(
                        f"Advarsel: ugyldig JSON på linje {line_number}: {error}",
                        file=sys.stderr,
                    )
                    continue

                entry_word = entry.get("word")

                if not isinstance(entry_word, str):
                    continue

                if normalize(entry_word) != target:
                    continue

                language_code = entry.get("lang_code")

                if args.lang and language_code and language_code != args.lang:
                    continue

                matches += 1
                print_entry(entry, args.raw)

    except OSError as error:
        print(f"Kunne ikke lese filen: {error}", file=sys.stderr)
        return 1

    if matches == 0:
        print(f"\nFant ingen oppføringer for «{args.word}».")
        return 2

    print(f"\nFant {matches} oppføring(er).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
