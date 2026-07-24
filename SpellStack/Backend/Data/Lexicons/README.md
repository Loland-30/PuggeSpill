# Generated lexicons

These compact JSON indexes are generated from Kaikki.org data derived from
Wiktionary. Do not edit them manually.

Regenerate them from the repository root with:

```powershell
python tools/lexicon-import/build_lexicon_es.py
python tools/lexicon-import/build_lexicon_jp.py
python tools/lexicon-import/build_lexicon_ko.py
```

Then copy the generated files from `tools/lexicon-import/output/` into this
directory. The large source extracts under `tools/lexicon-import/data/` are
intentionally excluded from Git, backend builds, Docker images, and
deployments.
