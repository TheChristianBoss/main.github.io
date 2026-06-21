import React from 'react'

export default function BookmarksPanel({ bookmarks, onOpen, onRemove }) {
  if (bookmarks.length === 0) {
    return (
      <div className="empty-state">
        No bookmarks yet. While reading, tap the ☆ next to any verse to save
        it here.
      </div>
    )
  }

  // Most recently added first.
  const sorted = [...bookmarks].sort((a, b) => b.addedAt - a.addedAt)

  return (
    <div className="search-results">
      <div className="reading-translation-name" style={{ marginBottom: 10 }}>
        {bookmarks.length} bookmarked verse{bookmarks.length === 1 ? '' : 's'}
      </div>
      {sorted.map((b) => (
        <div key={b.key} className="bookmark-item">
          <div className="search-result-item" style={{ flex: 1 }} onClick={() => onOpen(b)}>
            <div className="search-result-ref">
              {b.book} {b.chapter}:{b.verse}
              <span className="bookmark-translation"> · {b.translationName}</span>
            </div>
            <div className="search-result-text">{b.text}</div>
          </div>
          <button
            type="button"
            className="bookmark-remove"
            title="Remove bookmark"
            onClick={() => onRemove(b.key)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
