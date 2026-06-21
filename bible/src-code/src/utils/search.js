/**
 * Search for a keyword/phrase within a single translation's verse data.
 * Returns an array of { book, chapter, verse, text } matches.
 * Case-insensitive substring match.
 */
export function searchTranslation(booksData, query, limit = 100) {
  if (!booksData || !query || !query.trim()) return []
  const needle = query.trim().toLowerCase()
  const results = []

  for (const [book, chapters] of Object.entries(booksData)) {
    for (const [chapter, verses] of Object.entries(chapters)) {
      for (const [verse, text] of Object.entries(verses)) {
        if (text.toLowerCase().includes(needle)) {
          results.push({ book, chapter: Number(chapter), verse: Number(verse), text })
          if (results.length >= limit) return results
        }
      }
    }
  }
  return results
}
