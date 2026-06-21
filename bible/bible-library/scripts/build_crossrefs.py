#!/usr/bin/env python3
"""
Converts the openbible.info "Treasury of Scripture Knowledge"-style
cross-references TSV (OSIS book abbreviations, tab-separated
From/To/Votes) into a per-verse JSON index for the "related passages"
panel.

Run from the project root:
    python3 scripts/build_crossrefs.py /path/to/cross_references.txt

Input line shape (tab-separated, header row starts with "From Verse"):
    Gen.1.1\tJer.10.12\t76
    Gen.1.1\tJohn.1.1-John.1.3\t369      (range references on either side)
    Gen.1.2\t\t                          (some rows have an empty To/Votes)

Output: src/data/crossrefs/<book>.json, one shard per Bible book (66
files, a few hundred KB each instead of one ~8MB blob), plus
src/data/crossrefs/manifest.json listing which books have data.

  Genesis.json: {
    "1:1": [
      {"book": "Jeremiah", "chapter": 10, "verse": 12, "votes": 76},
      {"book": "John", "chapter": 1, "verse": 1, "endChapter": 1, "endVerse": 3, "votes": 369},
      ...
    ],
    ...
  }

Refs are sorted by votes descending (openbible.info's votes are a
crowd-sourced relevance score; negative votes exist in the source data
and are kept as-is rather than filtered, since "more info, ranked
honestly" beats silently dropping rows).
"""
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "src", "data", "crossrefs")

# OSIS abbreviation -> full book name, exactly as used as keys in this
# project's translation JSON files (see src/data/translations/kjv.json).
OSIS_TO_BOOK = {
    "Gen": "Genesis", "Exod": "Exodus", "Lev": "Leviticus", "Num": "Numbers",
    "Deut": "Deuteronomy", "Josh": "Joshua", "Judg": "Judges", "Ruth": "Ruth",
    "1Sam": "1 Samuel", "2Sam": "2 Samuel", "1Kgs": "1 Kings", "2Kgs": "2 Kings",
    "1Chr": "1 Chronicles", "2Chr": "2 Chronicles", "Ezra": "Ezra",
    "Neh": "Nehemiah", "Esth": "Esther", "Job": "Job", "Ps": "Psalms",
    "Prov": "Proverbs", "Eccl": "Ecclesiastes", "Song": "Song of Solomon",
    "Isa": "Isaiah", "Jer": "Jeremiah", "Lam": "Lamentations", "Ezek": "Ezekiel",
    "Dan": "Daniel", "Hos": "Hosea", "Joel": "Joel", "Amos": "Amos",
    "Obad": "Obadiah", "Jonah": "Jonah", "Mic": "Micah", "Nah": "Nahum",
    "Hab": "Habakkuk", "Zeph": "Zephaniah", "Hag": "Haggai", "Zech": "Zechariah",
    "Mal": "Malachi", "Matt": "Matthew", "Mark": "Mark", "Luke": "Luke",
    "John": "John", "Acts": "Acts", "Rom": "Romans", "1Cor": "1 Corinthians",
    "2Cor": "2 Corinthians", "Gal": "Galatians", "Eph": "Ephesians",
    "Phil": "Philippians", "Col": "Colossians", "1Thess": "1 Thessalonians",
    "2Thess": "2 Thessalonians", "1Tim": "1 Timothy", "2Tim": "2 Timothy",
    "Titus": "Titus", "Phlm": "Philemon", "Heb": "Hebrews", "Jas": "James",
    "1Pet": "1 Peter", "2Pet": "2 Peter", "1John": "1 John", "2John": "2 John",
    "3John": "3 John", "Jude": "Jude", "Rev": "Revelation",
}


def parse_osis_ref(raw):
    """'Gen.1.1' -> (Genesis, 1, 1, None, None)
    'John.1.1-John.1.3' -> (John, 1, 1, 1, 3) i.e. range, possibly cross-chapter
    Returns None for blank/unparseable refs."""
    raw = raw.strip()
    if not raw:
        return None
    start_raw, _, end_raw = raw.partition("-")

    def parse_one(part):
        bits = part.split(".")
        if len(bits) != 3:
            return None
        osis, chap, verse = bits
        book = OSIS_TO_BOOK.get(osis)
        if not book:
            return None
        try:
            return book, int(chap), int(verse)
        except ValueError:
            return None

    start = parse_one(start_raw)
    if not start:
        return None
    book, chapter, verse = start

    if end_raw:
        end = parse_one(end_raw)
        if end and end[0] == book:
            return book, chapter, verse, end[1], end[2]
    return book, chapter, verse, None, None


def main():
    if len(sys.argv) < 2:
        print("usage: build_crossrefs.py /path/to/cross_references.txt", file=sys.stderr)
        sys.exit(1)
    src_path = sys.argv[1]

    by_book = {}  # book -> { "chap:verse" -> [ {book, chapter, verse, endChapter?, endVerse?, votes} ] }
    skipped = 0
    total = 0

    with open(src_path, encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i == 0 and line.startswith("From Verse"):
                continue
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 2:
                continue
            from_raw, to_raw = parts[0], parts[1]
            votes_raw = parts[2] if len(parts) > 2 else ""

            from_parsed = parse_osis_ref(from_raw)
            to_parsed = parse_osis_ref(to_raw)
            if not from_parsed or not to_parsed:
                skipped += 1
                continue

            from_book, from_chap, from_verse, _, _ = from_parsed
            to_book, to_chap, to_verse, to_end_chap, to_end_verse = to_parsed
            try:
                votes = int(votes_raw) if votes_raw.strip() else 0
            except ValueError:
                votes = 0

            entry = {"book": to_book, "chapter": to_chap, "verse": to_verse, "votes": votes}
            if to_end_chap is not None:
                entry["endChapter"] = to_end_chap
                entry["endVerse"] = to_end_verse

            key = f"{from_chap}:{from_verse}"
            by_book.setdefault(from_book, {}).setdefault(key, []).append(entry)
            total += 1

    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = []
    for book, verses in by_book.items():
        for key, refs in verses.items():
            refs.sort(key=lambda r: -r["votes"])
        fname = book.replace(" ", "_") + ".json"
        with open(os.path.join(OUT_DIR, fname), "w", encoding="utf-8") as f:
            json.dump(verses, f, ensure_ascii=False, separators=(",", ":"))
        manifest.append(book)

    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False)

    total_size = sum(
        os.path.getsize(os.path.join(OUT_DIR, fn)) for fn in os.listdir(OUT_DIR)
    )
    print(
        f"Parsed {total} cross-refs across {len(by_book)} books "
        f"({skipped} rows skipped/unparseable)"
    )
    print(f"Wrote shards to {OUT_DIR} ({total_size / (1024 * 1024):.1f} MB total)")


if __name__ == "__main__":
    main()
