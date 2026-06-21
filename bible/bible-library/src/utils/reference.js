// Parses references like:
//   "Genesis 1"
//   "Genesis 1:1"
//   "Genesis 1:1-9"
//   "John 3:16"
// ...and more forgivingly:
//   "Gen 1:1"        (abbreviation)
//   "1st Samuel 2:3" / "First Samuel 2:3" / "I Samuel 2:3"  (ordinal variants)
//   "John 3 16"       (space instead of colon)
//   "john 3:16."      (trailing punctuation, case-insensitive)
// Returns { book, chapter, verseStart, verseEnd } or null if unparseable.
//
// Previously this only matched book names that exactly equalled a known
// translation's book key (case-insensitively) and required a literal
// "Book N:N-N" shape -- anything else (an abbreviation, an extra space,
// a trailing period) silently failed with zero feedback, which is the
// "the search bar doesn't work" experience. This version canonicalizes
// the book name against the known 66-book list so the rest of the app
// only ever sees real book names.

import { BOOK_ORDER } from './bookOrder.js'

// Common abbreviations and alternate names. Keys are lowercase, no
// trailing periods (periods are stripped before lookup).
const ABBREVIATIONS = {
  gen: 'Genesis', ge: 'Genesis', gn: 'Genesis',
  exod: 'Exodus', exo: 'Exodus', ex: 'Exodus',
  lev: 'Leviticus', le: 'Leviticus', lv: 'Leviticus',
  num: 'Numbers', nu: 'Numbers', nm: 'Numbers',
  deut: 'Deuteronomy', deu: 'Deuteronomy', dt: 'Deuteronomy',
  josh: 'Joshua', jos: 'Joshua',
  judg: 'Judges', jdg: 'Judges', jg: 'Judges',
  ruth: 'Ruth', ru: 'Ruth',
  '1sam': '1 Samuel', '1sa': '1 Samuel', '1sm': '1 Samuel', '1s': '1 Samuel',
  '2sam': '2 Samuel', '2sa': '2 Samuel', '2sm': '2 Samuel', '2s': '2 Samuel',
  '1kgs': '1 Kings', '1ki': '1 Kings', '1kg': '1 Kings',
  '2kgs': '2 Kings', '2ki': '2 Kings', '2kg': '2 Kings',
  '1chr': '1 Chronicles', '1ch': '1 Chronicles',
  '2chr': '2 Chronicles', '2ch': '2 Chronicles',
  ezra: 'Ezra', ezr: 'Ezra',
  neh: 'Nehemiah', ne: 'Nehemiah',
  esth: 'Esther', est: 'Esther', es: 'Esther',
  job: 'Job',
  ps: 'Psalms', psa: 'Psalms', psalm: 'Psalms', pss: 'Psalms', psm: 'Psalms',
  prov: 'Proverbs', pro: 'Proverbs', pr: 'Proverbs',
  eccl: 'Ecclesiastes', ecc: 'Ecclesiastes', qoh: 'Ecclesiastes',
  song: 'Song of Solomon', sos: 'Song of Solomon', canticles: 'Song of Solomon',
  'song of songs': 'Song of Solomon',
  isa: 'Isaiah', is: 'Isaiah',
  jer: 'Jeremiah', je: 'Jeremiah',
  lam: 'Lamentations', la: 'Lamentations',
  ezek: 'Ezekiel', eze: 'Ezekiel', ezk: 'Ezekiel',
  dan: 'Daniel', da: 'Daniel',
  hos: 'Hosea', ho: 'Hosea',
  joel: 'Joel', jl: 'Joel',
  amos: 'Amos', am: 'Amos',
  obad: 'Obadiah', oba: 'Obadiah', ob: 'Obadiah',
  jonah: 'Jonah', jon: 'Jonah',
  mic: 'Micah', mi: 'Micah',
  nah: 'Nahum', na: 'Nahum',
  hab: 'Habakkuk',
  zeph: 'Zephaniah', zep: 'Zephaniah', zp: 'Zephaniah',
  hag: 'Haggai',
  zech: 'Zechariah', zec: 'Zechariah', zc: 'Zechariah',
  mal: 'Malachi',
  matt: 'Matthew', mat: 'Matthew', mt: 'Matthew',
  mark: 'Mark', mrk: 'Mark', mk: 'Mark',
  luke: 'Luke', luk: 'Luke', lk: 'Luke',
  john: 'John', jn: 'John', jhn: 'John',
  acts: 'Acts', act: 'Acts',
  rom: 'Romans', ro: 'Romans',
  '1cor': '1 Corinthians', '1co': '1 Corinthians',
  '2cor': '2 Corinthians', '2co': '2 Corinthians',
  gal: 'Galatians', ga: 'Galatians',
  eph: 'Ephesians',
  phil: 'Philippians', php: 'Philippians',
  col: 'Colossians',
  '1thess': '1 Thessalonians', '1th': '1 Thessalonians',
  '2thess': '2 Thessalonians', '2th': '2 Thessalonians',
  '1tim': '1 Timothy', '1ti': '1 Timothy',
  '2tim': '2 Timothy', '2ti': '2 Timothy',
  titus: 'Titus', tit: 'Titus',
  philem: 'Philemon', phm: 'Philemon',
  heb: 'Hebrews',
  jas: 'James', jm: 'James',
  '1pet': '1 Peter', '1pe': '1 Peter', '1pt': '1 Peter',
  '2pet': '2 Peter', '2pe': '2 Peter', '2pt': '2 Peter',
  '1jn': '1 John', '1jo': '1 John',
  '2jn': '2 John', '2jo': '2 John',
  '3jn': '3 John', '3jo': '3 John',
  jude: 'Jude', jud: 'Jude',
  rev: 'Revelation', re: 'Revelation', apoc: 'Revelation',
}

const BOOK_SET_LOWER = new Map(BOOK_ORDER.map((b) => [b.toLowerCase(), b]))

// "1st"/"first"/"i" -> "1", "2nd"/"second"/"ii" -> "2", "3rd"/"third"/"iii" -> "3"
const ORDINAL_PREFIX = [
  [/^(1st|first|i)\s+/i, '1 '],
  [/^(2nd|second|ii)\s+/i, '2 '],
  [/^(3rd|third|iii)\s+/i, '3 '],
]

/**
 * Resolves arbitrary book text ("Gen", "1st Samuel", "REV", "song of
 * songs") to one of the 66 canonical book names, or null if it can't be
 * confidently resolved.
 */
export function resolveBookName(raw) {
  if (!raw) return null
  let text = raw.trim().replace(/\.+$/, '').replace(/\s+/g, ' ')
  if (!text) return null

  for (const [pattern, replacement] of ORDINAL_PREFIX) {
    text = text.replace(pattern, replacement)
  }

  const lower = text.toLowerCase()

  // Exact match against a real book name.
  if (BOOK_SET_LOWER.has(lower)) return BOOK_SET_LOWER.get(lower)

  // Known abbreviation (with or without internal spaces removed, since
  // "1 Sam" and "1sam" should both resolve).
  const compact = lower.replace(/\s+/g, '')
  if (ABBREVIATIONS[lower]) return ABBREVIATIONS[lower]
  if (ABBREVIATIONS[compact]) return ABBREVIATIONS[compact]

  // Unique prefix match against full book names (e.g. "Phili" is
  // ambiguous between Philippians/Philemon and is left unresolved;
  // "Philip" only matches Philippians, so it resolves).
  const prefixMatches = BOOK_ORDER.filter((b) => b.toLowerCase().startsWith(lower))
  if (prefixMatches.length === 1) return prefixMatches[0]

  return null
}

const REF_PATTERN = /^(.+?)\s+(\d+)(?:\s*[:.]?\s*(\d+)(?:\s*[-–]\s*(\d+))?)?$/

/**
 * Parses a free-typed reference into { book, chapter, verseStart, verseEnd }.
 * Accepts ':' or whitespace between chapter and verse, '-' or '–' for a
 * verse range, trailing periods, and book abbreviations/ordinal variants.
 * Returns null if the book can't be resolved or the shape doesn't match
 * at all -- callers should show the person an error in that case rather
 * than silently doing nothing.
 */
export function parseReference(input) {
  if (!input) return null
  const text = input.trim().replace(/\s+/g, ' ').replace(/[.,;]+$/, '')
  if (!text) return null

  const match = text.match(REF_PATTERN)
  if (!match) return null

  const [, bookRaw, chapter, verseStart, verseEnd] = match
  const book = resolveBookName(bookRaw)
  if (!book) return null

  return {
    book,
    chapter: parseInt(chapter, 10),
    verseStart: verseStart ? parseInt(verseStart, 10) : null,
    verseEnd: verseEnd ? parseInt(verseEnd, 10) : verseStart ? parseInt(verseStart, 10) : null,
  }
}

/**
 * Given a translation's `books` object and a parsed reference,
 * return an array of { verse, text } for the requested range.
 * If verseStart is null, returns the whole chapter.
 */
export function getVerses(booksData, ref) {
  if (!booksData || !ref) return []

  // Case-insensitive book name lookup (defensive -- ref.book should
  // already be canonical from parseReference, but this also lets
  // direct callers pass a loosely-cased book name).
  const bookKey = Object.keys(booksData).find(
    (b) => b.toLowerCase() === ref.book.toLowerCase()
  )
  if (!bookKey) return []

  const chapterData = booksData[bookKey][String(ref.chapter)]
  if (!chapterData) return []

  const verseNumbers = Object.keys(chapterData)
    .map(Number)
    .sort((a, b) => a - b)

  const start = ref.verseStart ?? verseNumbers[0]
  const end = ref.verseEnd ?? verseNumbers[verseNumbers.length - 1]

  return verseNumbers
    .filter((v) => v >= start && v <= end)
    .map((v) => ({ verse: v, text: chapterData[String(v)] }))
}

export function formatReference(ref) {
  if (!ref) return ''
  let str = `${ref.book} ${ref.chapter}`
  if (ref.verseStart) {
    str += `:${ref.verseStart}`
    if (ref.verseEnd && ref.verseEnd !== ref.verseStart) {
      str += `-${ref.verseEnd}`
    }
  }
  return str
}
