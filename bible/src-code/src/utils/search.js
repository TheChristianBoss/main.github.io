import { RELATED_SEARCH_TERMS } from '../data/relatedSearchTerms.js'

function stripTags(text) {
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]+\}/g, '')
}

function normalizeSearchText(text) {
  return stripTags(text)
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\p{L}\p{N}'"\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanDisplayText(text) {
  return stripTags(text).replace(/\s+/g, ' ').trim()
}

function uniqueTerms(terms) {
  const seen = new Set()
  const out = []

  for (const term of terms) {
    const normalized = normalizeSearchText(term)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
  }

  return out
}

function getTermsFromEntry(entry) {
  if (Array.isArray(entry)) return entry
  return entry?.terms || []
}

function expandedTermsForQuery(query) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return []

  const directEntry = RELATED_SEARCH_TERMS[normalizedQuery]

  if (directEntry) {
    return uniqueTerms([normalizedQuery, ...getTermsFromEntry(directEntry)])
  }

  const queryParts = normalizedQuery.split(/\s+/).filter(Boolean)
  const expanded = [normalizedQuery]

  for (const [key, entry] of Object.entries(RELATED_SEARCH_TERMS)) {
    const keyNorm = normalizeSearchText(key)
    const terms = getTermsFromEntry(entry)
    const normalizedTerms = terms.map(normalizeSearchText)

    const termMatch =
      normalizedTerms.includes(normalizedQuery) ||
      queryParts.some((part) => normalizedTerms.includes(part))

    if (termMatch && keyNorm !== normalizedQuery) {
      expanded.push(...terms)
    }
  }

  return uniqueTerms(expanded)
}

function textContainsTerm(text, term) {
  const normalizedText = ` ${normalizeSearchText(text)} `
  const normalizedTerm = ` ${normalizeSearchText(term)} `
  return normalizedText.includes(normalizedTerm)
}

function verseMatchesAnyTerm(text, terms) {
  return terms.some((term) => textContainsTerm(text, term))
}

function getBookEntries(booksData) {
  if (!booksData) return []

  if (Array.isArray(booksData)) {
    return booksData.map((book) => [book.name, book.chapters])
  }

  return Object.entries(booksData)
}

function getChapterEntries(chaptersData) {
  if (!chaptersData) return []

  if (Array.isArray(chaptersData)) {
    return chaptersData.map((chapter) => [chapter.number, chapter.verses])
  }

  return Object.entries(chaptersData)
}

function getVerseEntries(versesData) {
  if (!versesData) return []

  if (Array.isArray(versesData)) {
    return versesData.map((verse) => [verse.number, verse.text])
  }

  return Object.entries(versesData)
}

function finalizeResults(results, totalCount, limit, relatedTerms = []) {
  results.totalCount = totalCount
  results.limit = limit
  results.relatedTerms = relatedTerms
  return results
}

export function searchTranslation(booksData, query, limit = 100) {
  const normalizedQuery = normalizeSearchText(query)
  if (!booksData || !normalizedQuery) return finalizeResults([], 0, limit)

  const results = []
  let totalCount = 0

  for (const [book, chapters] of getBookEntries(booksData)) {
    for (const [chapter, verses] of getChapterEntries(chapters)) {
      for (const [verse, text] of getVerseEntries(verses)) {
        const cleanText = cleanDisplayText(text)

        if (normalizeSearchText(cleanText).includes(normalizedQuery)) {
          totalCount += 1

          if (results.length < limit) {
            results.push({
              book,
              chapter: Number(chapter),
              verse: Number(verse),
              text: cleanText,
            })
          }
        }
      }
    }
  }

  return finalizeResults(results, totalCount, limit)
}

export function searchTranslationRelated(booksData, query, limit = 100) {
  const terms = expandedTermsForQuery(query)
  if (!booksData || !terms.length) return finalizeResults([], 0, limit, terms)

  const results = []
  let totalCount = 0

  for (const [book, chapters] of getBookEntries(booksData)) {
    for (const [chapter, verses] of getChapterEntries(chapters)) {
      for (const [verse, text] of getVerseEntries(verses)) {
        const cleanText = cleanDisplayText(text)

        if (verseMatchesAnyTerm(cleanText, terms)) {
          totalCount += 1

          if (results.length < limit) {
            results.push({
              book,
              chapter: Number(chapter),
              verse: Number(verse),
              text: cleanText,
            })
          }
        }
      }
    }
  }

  return finalizeResults(results, totalCount, limit, terms)
}

export function getRelatedSearchTerms(query) {
  return expandedTermsForQuery(query)
}



