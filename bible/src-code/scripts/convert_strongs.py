#!/usr/bin/env python3
"""
Converts the raw Strong's dictionary (list of records with HTML-entity-encoded
Hebrew/Greek and HTML markup) into a clean lookup object keyed by Strong's
number, ready to ship as src/data/strongs.json.

Input record shape:
  {"id": 1, "number": "H1", "root_word": "&#1488;&#1489;",
   "transliteration": "'a&#770;b", "pronunciation": "awb",
   "tvm": None, "entry": "A primitive word; <i>father</i> ..."}

Two kinds of records:
  - Word entries: have `entry` (the definition), often `root_word` /
    `transliteration` / `pronunciation`.
  - Grammar (TVM = Tense/Voice/Mood) entries: have `tvm` instead of `entry`
    (e.g. H8804 = Qal Perfect). These are the codes that show up in the verse
    text as the parenthesized {(H8804)} form. They're real dictionary
    entries, just a different kind of entry.

Output shape (object, not array, for O(1) lookup by number):
  {
    "H7225": {
      "number": "H7225", "type": "word",
      "root_word": "ראשית", "transliteration": "re'shiyth",
      "pronunciation": "ray-sheeth'",
      "entry": "From H7218; the first, in place, time, order or rank..."
    },
    "H8804": {
      "number": "H8804", "type": "grammar",
      "stem": "Qal", "stemRef": "H8851",
      "mood": "Perfect", "moodRef": "H8816",
      "count": 12562
    },
    ...
  }
"""
import html
import json
import re
import sys

SRC = "/home/claude/original/Extras/strongs_definitions.json"
OUT = "/home/claude/project/src/data/strongs.json"


def clean_html_entities(s):
    """Decode numeric/named HTML entities (&#1488; etc.) into real characters."""
    if s is None:
        return None
    return html.unescape(s)


def clean_entry_text(s):
    """
    Clean a definition `entry` string. Keep <i> tags (they mark the headword
    gloss, e.g. <i>father</i>) since the popup renders this as light HTML.
    Just decode entities and tidy whitespace.
    """
    if s is None:
        return None
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


TVM_PART_RE = re.compile(
    r"<b>(?P<label>[^<]+):</b>\s*(?P<value>[^<]*?)(?:\s*See\s+(?P<ref>[HG]\d+))?\s*(?=<br>|$)"
)


def parse_tvm(raw):
    """
    Parse a `tvm` field into structured grammar info when it matches the
    common '<b>Stem:</b> Qal See H8851 <br><b>Mood:</b> ... <br><b>Count:</b> N'
    pattern. Falls back to a plain cleaned-text note for the handful of
    irregular entries (Kethiv/Qere/Synonym notes etc.).
    """
    if raw is None:
        return None

    text = html.unescape(raw)

    if "##" in text:
        # A few entries use '##' as a title/body separator instead of the
        # <b>Label:</b> pattern (Kethiv Readings, Qere Readings, etc.)
        title, _, body = text.partition("##")
        body = re.sub(r"<br\s*/?>", " ", body)
        body = re.sub(r"\s+", " ", body).strip()
        return {"type": "note", "title": title.strip(), "note": body}

    parts = {}
    for m in TVM_PART_RE.finditer(text):
        label = m.group("label").strip().lower()
        value = m.group("value").strip()
        ref = m.group("ref")
        if label == "count":
            parts["count"] = int(value) if value.isdigit() else None
        else:
            parts[label] = value
            if ref:
                parts[f"{label}Ref"] = ref

    if parts:
        parts["type"] = "grammar"
        return parts

    # Fallback: couldn't parse the pattern, keep a cleaned plain note.
    body = re.sub(r"<br\s*/?>", " ", text)
    body = re.sub(r"<[^>]+>", " ", body)
    body = re.sub(r"\s+", " ", body).strip()
    return {"type": "note", "note": body}


def convert():
    with open(SRC, encoding="utf-8") as f:
        records = json.load(f)

    out = {}
    skipped = 0

    for rec in records:
        number = rec.get("number")
        if not number:
            skipped += 1
            continue

        if rec.get("entry") is not None:
            out[number] = {
                "number": number,
                "type": "word",
                "root_word": clean_html_entities(rec.get("root_word")),
                "transliteration": clean_html_entities(rec.get("transliteration")),
                "pronunciation": clean_html_entities(rec.get("pronunciation")),
                "entry": clean_entry_text(rec.get("entry")),
            }
        elif rec.get("tvm") is not None:
            parsed = parse_tvm(rec.get("tvm"))
            entry = {"number": number}
            entry.update(parsed)
            out[number] = entry
        else:
            skipped += 1

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Wrote {len(out)} entries to {OUT} ({skipped} source records skipped)")

    # Sanity spot-checks
    for n in ["H7225", "H430", "H1254", "H8804", "H8799", "H853", "G3588", "H8675"]:
        print(n, "->", out.get(n))


if __name__ == "__main__":
    convert()
