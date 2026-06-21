// Canonical Protestant 66-book order, matching the key order used in every
// translation JSON file (see src/data/translations/kjv.json). Used to sort
// concordance and cross-reference results the way a reader expects --
// Genesis to Revelation -- rather than alphabetically.

export const BOOK_ORDER = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua',
  'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job',
  'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah',
  'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
  'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation',
]

const BOOK_INDEX = new Map(BOOK_ORDER.map((b, i) => [b, i]))

/** Returns the book's canonical index (0 = Genesis, 65 = Revelation), or
 * Infinity for an unrecognized name so unknowns sort last instead of
 * crashing a comparator. */
export function bookOrderIndex(book) {
  const i = BOOK_INDEX.get(book)
  return i === undefined ? Infinity : i
}

/** Comparator for sorting {book, chapter, verse} objects into reading order. */
export function compareByCanonicalOrder(a, b) {
  const ai = bookOrderIndex(a.book)
  const bi = bookOrderIndex(b.book)
  if (ai !== bi) return ai - bi
  if (a.chapter !== b.chapter) return a.chapter - b.chapter
  return a.verse - b.verse
}

// Chapter counts per book, used for "next/previous chapter" navigation
// (BookChapterPicker's dropdowns also use this, so chapter counts and
// canonical book order live in one place instead of two).
export const CHAPTER_COUNTS = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36, Ezra: 10,
  Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150, Proverbs: 31,
  Ecclesiastes: 12, 'Song of Solomon': 8, Isaiah: 66, Jeremiah: 52, Lamentations: 5,
  Ezekiel: 48, Daniel: 12, Hosea: 14, Joel: 3, Amos: 9,
  Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3, Habakkuk: 3,
  Zephaniah: 3, Haggai: 2, Zechariah: 14, Malachi: 4,
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28,
  Romans: 16, '1 Corinthians': 16, '2 Corinthians': 13, Galatians: 6, Ephesians: 6,
  Philippians: 4, Colossians: 4, '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6,
  '2 Timothy': 4, Titus: 3, Philemon: 1, Hebrews: 13, James: 5,
  '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
  Jude: 1, Revelation: 22,
}

/**
 * Returns { book, chapter } for the chapter after the given one, crossing
 * into the next book at a book's last chapter, or null if already at the
 * very last chapter of Revelation (nothing further to go to).
 */
export function getNextChapterRef(book, chapter) {
  const count = CHAPTER_COUNTS[book]
  if (!count) return null
  if (chapter < count) return { book, chapter: chapter + 1 }
  const idx = bookOrderIndex(book)
  const nextBook = BOOK_ORDER[idx + 1]
  return nextBook ? { book: nextBook, chapter: 1 } : null
}

/**
 * Returns { book, chapter } for the chapter before the given one, crossing
 * back into the previous book's last chapter, or null if already at
 * Genesis 1 (nothing further back to go to).
 */
export function getPrevChapterRef(book, chapter) {
  if (chapter > 1) return { book, chapter: chapter - 1 }
  const idx = bookOrderIndex(book)
  const prevBook = BOOK_ORDER[idx - 1]
  return prevBook ? { book: prevBook, chapter: CHAPTER_COUNTS[prevBook] } : null
}
