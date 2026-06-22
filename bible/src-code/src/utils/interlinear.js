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
const ASCII_CODE_RE = /^[A-Z0-9-]+$/

/**
 * Tokenizes one verse of tr-parsed-nt text into ordered Greek words:
 *   [{ word, strongsNumbers, parsing }, ...]
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
      continue
    }

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

export function loadHebrewInterlinearText() {
  if (!hebrewPromise) {
    const url = `${import.meta.env.BASE_URL}data/oshb.json`

    hebrewPromise = fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load Hebrew interlinear data from ${url}`)
      }
      return response.json()
    })
  }

  return hebrewPromise
}

/**
 * Looks up the Greek NT or Hebrew OT original-language verse.
 * Returns:
 *   { kind: 'greek', words: [...] }
 *   { kind: 'hebrew', words: [...] }
 *   null
 */
export async function loadOriginalLanguageVerse(book, chapter, verse) {
  if (isNewTestamentBook(book)) {
    const data = await loadGreekInterlinearText()
    const raw = data?.books?.[book]?.[String(chapter)]?.[String(verse)]
    return raw ? { kind: 'greek', words: parseGreekInterlinearVerse(raw) } : null
  }

  const data = await loadHebrewInterlinearText()
  const words = data?.books?.[book]?.[String(chapter)]?.[String(verse)]
  return Array.isArray(words) ? { kind: 'hebrew', words } : null
}
