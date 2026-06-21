import React from 'react'

function highlight(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function SearchResults({ results, query, translationName, onPick }) {
  return (
    <div className="search-results">
      <div className="reading-translation-name" style={{ marginBottom: 10 }}>
        {results.length} result{results.length === 1 ? '' : 's'} for "{query}" in {translationName}
      </div>
      {results.map((r) => (
        <div
          className="search-result-item"
          key={`${r.book}-${r.chapter}-${r.verse}`}
          onClick={() => onPick(r)}
        >
          <div className="search-result-ref">{r.book} {r.chapter}:{r.verse}</div>
          <div className="search-result-text">{highlight(r.text, query)}</div>
        </div>
      ))}
    </div>
  )
}
