// Interlinear view support.
//
// Greek NT: tr-parsed-nt.json gives real word-by-word data in original
// (Greek) word order -- each token is "<greek word> <Gnumber> [<Gnumber>]
// <parsing-code>", e.g. "ηγαπησεν G25 G5656 V-AAI-3S". The second
// G-number (when present) is a grammar/TVM entry in strongs.json
// (type: "grammar"), not a second lexical word -- see classifyStrongsTag
// in strongs.js for the same H/G-number-space distinction the Hebrew
// Strong's-tagged translations already rely on.
//
// Hebrew OT: wlc.json is plain Hebrew text with no per-word Strong's
// tags, so there's no source in this library to build a true word-order
// interlinear from. The best honest fallback is a verse-level view:
// the Hebrew text on one line, the active Strong's-tagged English
// translation's tagged words below it, each still tappable for its
// definition -- not aligned word-for-word, just side by side.

const NT_BOOKS = new Set([
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
  '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus',
  'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John',
  '2 John', '3 John', 'Jude', 'Revelation',
])

export function isNewTestamentBook(book) {
  return NT_BOOKS.has(book)
}

const STRONGS_TAG_RE = /^[GH]\d+$/
// Robinson's-style parsing codes are pure ASCII letters/digits/hyphens
// (e.g. "V-IXI-3S", "PREP", "N-NSF", "PRT-N"); Greek words use Greek-
// script characters, so this single regex reliably tells the two apart.
const ASCII_CODE_RE = /^[A-Z0-9-]+$/

/**
 * Tokenizes one verse of tr-parsed-nt text into ordered words:
 *   [{ word: 'ηγαπησεν', strongsNumbers: ['G25', 'G5656'], parsing: 'V-AAI-3S' }, ...]
 */
export function parseGreekInterlinearVerse(text) {
  if (!text) return []
  const tokens = text.trim().split(/\s+/)
  const words = []
  let current = null

  for (const token of tokens) {
    if (STRONGS_TAG_RE.test(token)) {
      if (current) current.strongsNumbers.push(token)
      continue
    }
    if (ASCII_CODE_RE.test(token)) {
      if (current && current.parsing === null) {
        current.parsing = token
        words.push(current)
        current = null
      }
      // Else: an orphan parsing code with no pending word to attach to.
      // A handful of verses in the source data carry a duplicate
      // Strong's+parsing pair right after a word closes (an alternate
      // textual-variant reading) -- skip rather than read it as a new word.
      continue
    }
    // A new Greek word -- flush whatever's pending first (defensive; the
    // data always ends each word with a parsing code, so this is rare).
    if (current) words.push(current)
    current = { word: token, strongsNumbers: [], parsing: null }
  }
  if (current) words.push(current)
  return words
}

let greekPromise = null
export function loadGreekInterlinearText() {
  if (!greekPromise) {
    greekPromise = import('../data/translations/tr-parsed-nt.json').then((m) => m.default)
  }
  return greekPromise
}

let hebrewPromise = null
export function loadHebrewText() {
  if (!hebrewPromise) {
    hebrewPromise = import('../data/translations/wlc.json').then((m) => m.default)
  }
  return hebrewPromise
}

/**
 * Looks up the Greek (NT) or Hebrew (OT) original-language verse text
 * for a reference, returning null if unavailable (e.g. OT book in the
 * Greek path, or a reference outside both data sets).
 */
export async function loadOriginalLanguageVerse(book, chapter, verse) {
  if (isNewTestamentBook(book)) {
    const data = await loadGreekInterlinearText()
    const raw = data?.books?.[book]?.[String(chapter)]?.[String(verse)]
    return raw ? { kind: 'greek', words: parseGreekInterlinearVerse(raw) } : null
  }
  const data = await loadHebrewText()
  const raw = data?.books?.[book]?.[String(chapter)]?.[String(verse)]
  return raw ? { kind: 'hebrew', text: raw } : null
}
