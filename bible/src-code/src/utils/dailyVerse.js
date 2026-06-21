// Picks a pseudo-random verse for the "daily verse" feature. The pick is
// seeded by today's date (and the translation id), so it stays the same
// all day and the same across reloads, but changes tomorrow.

function seededRandom(seed) {
  // Small deterministic PRNG (mulberry32) seeded from a string.
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return function () {
    h |= 0
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function todaySeed() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/**
 * Returns { book, chapter, verse, text } for today's verse, or null if
 * the translation's book data isn't loaded.
 */
export function pickDailyVerse(booksData, translationId) {
  if (!booksData) return null

  const bookNames = Object.keys(booksData)
  if (bookNames.length === 0) return null

  const rand = seededRandom(`${todaySeed()}|${translationId}`)

  const book = bookNames[Math.floor(rand() * bookNames.length)]
  const chapterNames = Object.keys(booksData[book])
  const chapter = chapterNames[Math.floor(rand() * chapterNames.length)]
  const verseNumbers = Object.keys(booksData[book][chapter])
  const verse = verseNumbers[Math.floor(rand() * verseNumbers.length)]

  return {
    book,
    chapter,
    verse,
    text: booksData[book][chapter][verse],
  }
}
