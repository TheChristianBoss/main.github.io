// Parses references like:
//   "Genesis 1"
//   "Genesis 1:1"
//   "Genesis 1:1-9"
//   "John 3:16"
// Returns { book, chapter, verseStart, verseEnd } or null if unparseable.

export function parseReference(input) {
  if (!input) return null
  const text = input.trim()

  // Match: <book name> <chapter>[:<verse>[-<verse>]]
  const match = text.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/)
  if (!match) return null

  const [, book, chapter, verseStart, verseEnd] = match

  return {
    book: book.trim(),
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

  // Case-insensitive book name lookup
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
