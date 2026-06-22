import React from 'react'

function cleanVerseText(text) {
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]+\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function highlight(text, query) {
  if (!query) return text

  const cleanText = cleanVerseText(text)
  const idx = cleanText.toLowerCase().indexOf(query.toLowerCase())

  if (idx === -1) return cleanText

  return (
    <>
      {cleanText.slice(0, idx)}
      <mark>{cleanText.slice(idx, idx + query.length)}</mark>
      {cleanText.slice(idx + query.length)}
    </>
  )
}

export default function SearchResults({
  results,
  query,
  translationName,
  onPick,
  onLoadMore,
  searchMode = 'exact',
}) {
  const visibleCount = results.length
  const totalCount = Number.isFinite(results.totalCount) ? results.totalCount : visibleCount
  const isLimited = totalCount > visibleCount
  const relatedTerms = Array.isArray(results.relatedTerms) ? results.relatedTerms : []
  const showRelatedTerms = searchMode === 'related' && relatedTerms.length > 1
  const relatedPreview = relatedTerms.slice(0, 20).join(', ')
  const extraTermCount = Math.max(0, relatedTerms.length - 20)

  return (
    <div className="search-results">
      <div className="reading-translation-name" style={{ marginBottom: 10 }}>
        {isLimited ? `Showing ${visibleCount} of ${totalCount}` : totalCount} result{totalCount === 1 ? '' : 's'} for "{query}" in {translationName}
      </div>

      {showRelatedTerms && (
        <div className="search-related-terms">
          Expanded to: {relatedPreview}{extraTermCount ? `, +${extraTermCount} more` : ''}
        </div>
      )}

      {results.map((r) => (
        <div
          className="search-result-item"
          key={`${r.book}-${r.chapter}-${r.verse}`}
          onClick={() => onPick(r)}
        >
          <div className="search-result-ref">
            {r.book} {r.chapter}:{r.verse}
          </div>

          <div className="search-result-text">
            {highlight(r.text, query)}
          </div>
        </div>
      ))}

      {isLimited && typeof onLoadMore === 'function' && (
        <button className="search-load-more" type="button" onClick={onLoadMore}>
          Load 100 more
        </button>
      )}
    </div>
  )
}
