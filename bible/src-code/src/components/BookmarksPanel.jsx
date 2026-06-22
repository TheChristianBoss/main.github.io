import React, { useCallback, useEffect, useState } from 'react'
import { loadStrongsDictionary, parseStrongsText, tagNumber } from '../utils/strongs.js'
import StrongsPopup from './StrongsPopup.jsx'

function hasStrongsTags(text) {
  return /\{[HG]\d+\}/.test(String(text || ''))
}

function StrongsWord({ text, tags, onOpen }) {
  const handleClick = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    onOpen({
      word: text,
      tags,
      position: {
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
      },
    })
  }

  return (
    <span className="strongs-word" onClick={handleClick}>
      {text}
    </span>
  )
}

function BookmarkVerseText({ text, hasStrongs, onWordClick }) {
  if (!hasStrongs) return <>{text}</>

  const segments = parseStrongsText(text)

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <React.Fragment key={i}>{seg.content}</React.Fragment>
        ) : seg.tags.length === 0 ? (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        ) : (
          <StrongsWord key={i} text={seg.text} tags={seg.tags} onOpen={onWordClick} />
        )
      )}
    </>
  )
}

export default function BookmarksPanel({ bookmarks, onOpen, onRemove }) {
  const [strongsDict, setStrongsDict] = useState(null)
  const [popup, setPopup] = useState(null)

  const anyStrongs = bookmarks.some((b) => b.hasStrongs || hasStrongsTags(b.text))

  useEffect(() => {
    setPopup(null)

    if (anyStrongs) {
      loadStrongsDictionary().then(setStrongsDict)
    }
  }, [anyStrongs])

  const openPopup = useCallback(({ word, tags, position }) => {
    setPopup({ word, tags, position })
  }, [])

  if (bookmarks.length === 0) {
    return (
      <div className="empty-state">
        No bookmarks yet. While reading, tap the ☆ next to any verse to save it here.
      </div>
    )
  }

  const sorted = [...bookmarks].sort((a, b) => b.addedAt - a.addedAt)

  const popupEntries = popup
    ? popup.tags.map((tag) => {
        const num = tagNumber(tag)
        return {
          number: num,
          entry: strongsDict ? strongsDict[num] || null : null,
        }
      })
    : []

  return (
    <div className="search-results">
      <div className="reading-translation-name" style={{ marginBottom: 10 }}>
        {bookmarks.length} bookmarked verse{bookmarks.length === 1 ? '' : 's'}
      </div>

      {sorted.map((b) => {
        const bookmarkHasStrongs = b.hasStrongs || hasStrongsTags(b.text)

        return (
          <div key={b.key} className="bookmark-item">
            <div className="search-result-item" style={{ flex: 1 }} onClick={() => onOpen(b)}>
              <div className="search-result-ref">
                {b.book} {b.chapter}:{b.verse}
                <span className="bookmark-translation"> · {b.translationName}</span>
              </div>

              <div className="search-result-text">
                <BookmarkVerseText
                  text={b.text}
                  hasStrongs={bookmarkHasStrongs}
                  onWordClick={openPopup}
                />
              </div>
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
        )
      })}

      {popup && (
        <StrongsPopup
          word={popup.word}
          entries={popupEntries}
          position={popup.position}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
