#!/usr/bin/env python3
"""
Builds the concordance index: for every Strong's number that appears in any
hasStrongs translation, record every (translation, book, chapter, verse)
location it occurs in. This makes "show me every verse using H1254" an O(1)
lookup instead of a full-text scan at query time.

Run from the project root (where src/data/ lives):
    python3 scripts/build_concordance.py

Input: src/data/translations/<id>.json for every translation in catalog.js
       that has `hasStrongs: true`.
Output: sharded into src/data/concordance/<shard>.json, one shard per 500
numbers (H0-H499.json, H500-H999.json, G0-G499.json, ...), plus a small
src/data/concordance/manifest.json mapping each Strong's number to its
shard file. Sharding keeps any single fetch small (~2MB) instead of
loading one ~65MB blob just to look up one number -- src/utils/concordance.js
loads the manifest once, then dynamically imports only the shard a given
lookup needs, the same lazy-loading pattern loadTranslation.js already
uses for translation text.

  manifest.json: { "H1254": "H1000-H1499", "G26": "G0-G499", ... }
  H1000-H1499.json: {
    "H1254": {
      "kjv-strongs": [{"book": "Genesis", "chapter": 1, "verse": 1}, ...],
      "asv-strongs": [...]
    },
    ...
  }

Only *word*-type tags are indexed (grammar/TVM tags in parens, e.g.
"(H8804)", are skipped -- see is_word_tag below). The index intentionally
does not include verse text, just refs, to stay small; the UI re-fetches
verse text on demand the same way ReadingPane already does.
"""
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TRANSLATIONS_DIR = os.path.join(ROOT, "src", "data", "translations")
CATALOG_PATH = os.path.join(ROOT, "src", "data", "catalog.js")
CONCORDANCE_DIR = os.path.join(ROOT, "src", "data", "concordance")
SHARD_SIZE = 500

TAG_RE = re.compile(r"\{([^}]+)\}")


def get_strongs_translation_ids():
    """Parse catalog.js with a regex (it's a plain JS array literal) to find
    every translation id whose entry has `hasStrongs: true`."""
    with open(CATALOG_PATH, encoding="utf-8") as f:
        src = f.read()
    ids = []
    for entry in re.findall(r"\{[^{}]*\}", src):
        if "hasStrongs: true" in entry or "hasStrongs:true" in entry:
            m = re.search(r'id:\s*"([^"]+)"', entry)
            if m:
                ids.append(m.group(1))
    return ids


def tag_number(raw_tag):
    """'(H8804)' -> 'H8804', 'G0011' -> 'G11'."""
    raw = raw_tag.strip("()")
    m = re.match(r"^([HG])0*(\d+)$", raw)
    return (m.group(1) + m.group(2)) if m else raw


def is_word_tag(num, strongs_dict):
    """Only index tags that resolve to a dictionary *word* entry -- this
    excludes grammar/TVM codes (which use the same H/G number space) and
    any tag with no dictionary entry at all."""
    entry = strongs_dict.get(num)
    return bool(entry) and entry.get("type") == "word"


def main():
    strongs_ids = get_strongs_translation_ids()
    if not strongs_ids:
        print("No hasStrongs translations found in catalog.js", file=sys.stderr)
        sys.exit(1)

    with open(os.path.join(ROOT, "src", "data", "strongs.json"), encoding="utf-8") as f:
        strongs_dict = json.load(f)

    index = {}  # number -> { translationId -> [ {book, chapter, verse} ] }

    for tid in strongs_ids:
        path = os.path.join(TRANSLATIONS_DIR, f"{tid}.json")
        if not os.path.exists(path):
            print(f"  skip {tid}: no file", file=sys.stderr)
            continue
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        count = 0
        for book, chapters in data["books"].items():
            for chapter, verses in chapters.items():
                for verse, text in verses.items():
                    if not text or "{" not in text:
                        continue
                    seen_in_verse = set()
                    for raw_tag in TAG_RE.findall(text):
                        num = tag_number(raw_tag)
                        if num in seen_in_verse:
                            continue
                        if not is_word_tag(num, strongs_dict):
                            continue
                        seen_in_verse.add(num)
                        bucket = index.setdefault(num, {}).setdefault(tid, [])
                        bucket.append(
                            {"book": book, "chapter": int(chapter), "verse": int(verse)}
                        )
                        count += 1
        print(f"  {tid}: {count} tagged-word occurrences indexed")

    os.makedirs(CONCORDANCE_DIR, exist_ok=True)
    shards = {}  # shard_name -> { number -> {translationId: [refs]} }
    manifest = {}  # number -> shard_name

    for num, by_translation in index.items():
        prefix = num[0]  # 'H' or 'G'
        n = int(num[1:])
        bucket_start = (n // SHARD_SIZE) * SHARD_SIZE
        shard_name = f"{prefix}{bucket_start}-{prefix}{bucket_start + SHARD_SIZE - 1}"
        shards.setdefault(shard_name, {})[num] = by_translation
        manifest[num] = shard_name

    for shard_name, shard_data in shards.items():
        with open(os.path.join(CONCORDANCE_DIR, f"{shard_name}.json"), "w", encoding="utf-8") as f:
            json.dump(shard_data, f, ensure_ascii=False, separators=(",", ":"))

    with open(os.path.join(CONCORDANCE_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(",", ":"))

    total_size = sum(
        os.path.getsize(os.path.join(CONCORDANCE_DIR, fn))
        for fn in os.listdir(CONCORDANCE_DIR)
    )
    print(
        f"Wrote {len(shards)} shards + manifest to {CONCORDANCE_DIR} "
        f"({len(index)} Strong's numbers, {total_size / (1024 * 1024):.1f} MB total)"
    )


if __name__ == "__main__":
    main()
