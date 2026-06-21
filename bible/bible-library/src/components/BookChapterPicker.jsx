import React from 'react'
import { BOOK_ORDER, CHAPTER_COUNTS } from '../utils/bookOrder.js'

// Re-exported for backward compatibility with anything importing BOOKS
// from here -- canonical Protestant 66-book order now lives in
// src/utils/bookOrder.js, shared with chapter-navigation and sorting.
export const BOOKS = BOOK_ORDER

export default function BookChapterPicker({ book, chapter, onChange }) {
  const chapterCount = CHAPTER_COUNTS[book] || 1
  const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1)

  return (
    <div className="picker-row">
      <select
        className="picker"
        value={book}
        onChange={(e) => onChange({ book: e.target.value, chapter: 1 })}
        aria-label="Book"
      >
        {BOOKS.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
      <select
        className="picker"
        value={chapter}
        onChange={(e) => onChange({ book, chapter: Number(e.target.value) })}
        aria-label="Chapter"
        style={{ flex: '0 0 90px' }}
      >
        {chapters.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  )
}
