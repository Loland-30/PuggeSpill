from __future__ import annotations

import gzip
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


BUILDER_PATH = Path(__file__).resolve().parents[1] / "build_lexicon_jp.py"
SPEC = importlib.util.spec_from_file_location("build_lexicon_jp", BUILDER_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Could not load builder from {BUILDER_PATH}")

builder = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = builder
SPEC.loader.exec_module(builder)


def entry(
    word: str,
    *,
    part_of_speech: str = "noun",
    forms: list[dict[str, object]] | None = None,
    glosses: list[str] | None = None,
) -> dict[str, object]:
    value: dict[str, object] = {
        "lang_code": "ja",
        "word": word,
        "pos": part_of_speech,
        "senses": [{"glosses": glosses or []}],
    }
    if forms is not None:
        value["forms"] = forms
    return value


class JapaneseLexiconBuilderTests(unittest.TestCase):
    def build_fixture(
        self,
        entries: list[dict[str, object]],
        *,
        include_malformed_line: bool = False,
    ) -> dict[str, object]:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            source = root / "fixture.jsonl.gz"
            output = root / "ja-readings.json"

            with gzip.open(source, mode="wt", encoding="utf-8") as handle:
                if include_malformed_line:
                    handle.write("{malformed json\n")
                for raw_entry in entries:
                    handle.write(json.dumps(raw_entry, ensure_ascii=False) + "\n")

            arguments = [
                str(BUILDER_PATH),
                "--source",
                str(source),
                "--output",
                str(output),
            ]
            with patch.object(sys, "argv", arguments):
                self.assertEqual(0, builder.main())

            return json.loads(output.read_text(encoding="utf-8"))

    def test_structured_forms_remain_preferred(self) -> None:
        payload = self.build_fixture(
            [
                entry(
                    "\u6625",
                    forms=[
                        {
                            "form": "\u306f\u308b",
                            "tags": ["transliteration", "kun", "joyo"],
                        }
                    ],
                    glosses=["\uff08\u3057\u3085\u3093\uff09later fallback"],
                )
            ]
        )

        readings = payload["entries"]["\u6625"][0]["readings"]
        self.assertEqual(["\u306f\u308b"], [reading["text"] for reading in readings])
        self.assertEqual("forms", readings[0]["source"])
        self.assertEqual("structured", readings[0]["confidence"])

    def test_gloss_fallback_extracts_and_deduplicates_in_source_order(self) -> None:
        payload = self.build_fixture(
            [
                entry(
                    "\u5927\u4eba",
                    glosses=[
                        "\uff08\u304a\u3068\u306a\uff09first sense",
                        "\uff08\u304a\u3068\u306a\uff09duplicate",
                    ],
                ),
                entry(
                    "\u660e\u65e5",
                    glosses=[
                        (
                            "\uff08\u307f\u3087\u3046\u306b\u3061\u3001"
                            "\u3042\u3059\u3001\u3042\u3057\u305f\uff09next day"
                        ),
                        "\uff08\u3042\u3059\u3001\u3042\u3057\u305f\uff09future",
                    ],
                ),
            ]
        )

        adult_readings = payload["entries"]["\u5927\u4eba"][0]["readings"]
        self.assertEqual(["\u304a\u3068\u306a"], [reading["text"] for reading in adult_readings])
        self.assertEqual("gloss", adult_readings[0]["source"])
        self.assertEqual("fallback", adult_readings[0]["confidence"])

        tomorrow_readings = payload["entries"]["\u660e\u65e5"][0]["readings"]
        self.assertEqual(
            ["\u307f\u3087\u3046\u306b\u3061", "\u3042\u3059", "\u3042\u3057\u305f"],
            [reading["text"] for reading in tomorrow_readings],
        )

    def test_unsafe_or_nonleading_parentheses_are_ignored(self) -> None:
        payload = self.build_fixture(
            [
                entry("\u8aac\u660e", glosses=["explanation \uff08\u305b\u3064\u3081\u3044\uff09"]),
                entry("\u6f22\u5b57", glosses=["\uff08\u6f22\u5b57\uff09contains kanji"]),
                entry("\u82f1\u8a9e", glosses=["\uff08english\uff09contains Latin"]),
                entry("\u4e0d\u6b63", glosses=["\uff08\u3075\u305b\u3044 malformed"]),
            ]
        )

        self.assertEqual({}, payload["entries"])

    def test_name_entries_and_kana_only_words_are_excluded(self) -> None:
        payload = self.build_fixture(
            [
                entry("\u660e\u65e5", glosses=["\uff08\u3042\u3057\u305f\uff09next day"]),
                entry(
                    "\u660e\u65e5",
                    part_of_speech="name",
                    glosses=["\uff08\u3042\u3059\uff09surname"],
                ),
                entry("\u304a\u3068\u306a", glosses=["\uff08\u304a\u3068\u306a\uff09adult"]),
            ]
        )

        tomorrow_entries = payload["entries"]["\u660e\u65e5"]
        self.assertEqual(1, len(tomorrow_entries))
        self.assertEqual("noun", tomorrow_entries[0]["partOfSpeech"])
        self.assertNotIn("\u304a\u3068\u306a", payload["entries"])

    def test_malformed_json_line_does_not_abort_build(self) -> None:
        payload = self.build_fixture(
            [entry("\u5927\u4eba", glosses=["\uff08\u304a\u3068\u306a\uff09adult"])],
            include_malformed_line=True,
        )

        self.assertIn("\u5927\u4eba", payload["entries"])


if __name__ == "__main__":
    unittest.main()
