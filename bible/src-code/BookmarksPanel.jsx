import React, { useCallback, useEffect, useState } from 'react'
import { HIGHLIGHT_COLORS, verseKey } from '../utils/verseKey.js'
import { loadStrongsDictionary, parseStrongsText, tagNumber } from '../utils/strongs.js'
import StrongsPopup from './StrongsPopup.jsx'

function hasStrongsTags(text) {
  return /\{[HG]\d+\}/.test(String(text || ''))
}

function passageLabel(b) {
  if (b.type === 'passage' && b.verseStart && b.verseEnd && Number(b.verseStart) !== Number(b.verseEnd)) {
    return `${b.book} ${b.chapter}:${b.verseStart}-${b.verseEnd}`
  }

  return `${b.book} ${b.chapter}:${b.verse}`
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

function HighlightedBookmarkVerse({
  bookmark,
  verse,
  highlights,
  hasStrongs,
  onWordClick,
}) {
  const key = verseKey(bookmark.translationId, verse.book, verse.chapter, verse.verse)
  const highlightColor = highlights?.[key]
  const highlight = highlightColor ? HIGHLIGHT_COLORS[highlightColor] : null
  const style = highlight ? { backgroundColor: highlight.bg } : undefined

  return (
    <div className="bookmark-passage-verse" style={style}>
      <span className="bookmark-passage-verse-num">{verse.verse}</span>
      <span>
        <BookmarkVerseText
          text={verse.text}
          hasStrongs={hasStrongs}
          onWordClick={onWordClick}
        />
      </span>
    </div>
  )
}

export default function BookmarksPanel({ bookmarks, highlights = {}, onOpen, onRemove }) {
  const [strongsDict, setStrongsDict] = useState(null)
  const [popup, setPopup] = useState(null)

  const anyStrongs = bookmarks.some((b) => {
    if (b.hasStrongs || hasStrongsTags(b.text)) return true
    return Array.isArray(b.verses) && b.verses.some((v) => hasStrongsTags(v.text))
  })

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
        No bookmarks yet. While reading, tap the star next to any verse to save it here.
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
        {bookmarks.length} bookmark{bookmarks.length === 1 ? '' : 's'}
      </div>

      {sorted.map((b) => {
        const verses = Array.isArray(b.verses) && b.verses.length
          ? b.verses
          : [{ book: b.book, chapter: b.chapter, verse: b.verse, text: b.text }]

        const bookmarkHasStrongs =
          b.hasStrongs ||
          hasStrongsTags(b.text) ||
          verses.some((v) => hasStrongsTags(v.text))

        return (
          <div key={b.key} className="bookmark-item">
            <div className="search-result-item" style={{ flex: 1 }} onClick={() => onOpen(b)}>
              <div className="search-result-ref">
                {passageLabel(b)}
                <span className="bookmark-translation"> - {b.translationName}</span>
                {b.type === 'passage' && (
                  <span className="bookmark-translation"> - {b.scope === 'chapter' ? 'chapter' : 'passage'}</span>
                )}
              </div>

              <div className="search-result-text">
                {verses.map((v) => (
                  <HighlightedBookmarkVerse
                    key={`${v.book}-${v.chapter}-${v.verse}`}
                    bookmark={b}
                    verse={v}
                    highlights={highlights}
                    hasStrongs={bookmarkHasStrongs}
                    onWordClick={openPopup}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              className="bookmark-remove"
              title="Remove bookmark"
              onClick={() => onRemove(b.key)}
            >
              x
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
