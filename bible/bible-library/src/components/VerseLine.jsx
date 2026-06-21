import React, { useState, useRef, useEffect } from 'react'
import { HIGHLIGHT_COLORS } from '../utils/verseKey.js'
import { parseStrongsText } from '../utils/strongs.js'

function StrongsWord({ text, tags, onOpen }) {
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onOpen({
      word: text,
      tags,
      position: { top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX },
    })
  }
  return (
    <span className="strongs-word" onClick={handleClick}>
      {text}
    </span>
  )
}

function VerseText({ text, hasStrongs, onWordClick }) {
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

export default function VerseLine({
  book,
  chapter,
  verse,
  text,
  isJesus,
  redLetterEnabled,
  redLetterColor,
  isBookmarked,
  highlightColor,
  onToggleBookmark,
  onSetHighlight,
  hasStrongs,
  onWordClick,
  onShowCrossRefs,
  onShareVerse,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const handleCopy = async () => {
    const cleanText = hasStrongs ? text.replace(/\{[^}]+\}/g, '') : text
    const quote = `"${cleanText}" — ${book} ${chapter}:${verse}`
    try {
      await navigator.clipboard.writeText(quote)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable — silently no-op.
    }
  }

  const verseStyle =
    isJesus && redLetterEnabled ? { color: redLetterColor } : undefined

  const wrapStyle = highlightColor
    ? { backgroundColor: HIGHLIGHT_COLORS[highlightColor]?.bg }
    : undefined

  return (
    <span className="verse-line" ref={rootRef}>
      <p className="verse" style={wrapStyle}>
        <span className="verse-num">{verse}</span>
        <span style={verseStyle}>
          <VerseText text={text} hasStrongs={hasStrongs} onWordClick={onWordClick} />
        </span>
        <span className="verse-toolbar">
          <button
            type="button"
            className={`verse-btn ${isBookmarked ? 'active' : ''}`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this verse'}
            onClick={onToggleBookmark}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
          <button
            type="button"
            className="verse-btn"
            title="Copy verse"
            onClick={handleCopy}
          >
            {copied ? '✓' : '⧉'}
          </button>
          {onShowCrossRefs && (
            <button
              type="button"
              className="verse-btn"
              title="Related passages"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                onShowCrossRefs({
                  book,
                  chapter,
                  verse,
                  position: { top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX },
                })
              }}
            >
              ⛓
            </button>
          )}
          {onShareVerse && (
            <button
              type="button"
              className="verse-btn"
              title="Share as image"
              onClick={() => onShareVerse({ book, chapter, verse, text })}
            >
              ⤴
            </button>
          )}
          <span className="verse-highlight-wrap">
            <button
              type="button"
              className={`verse-btn ${highlightColor ? 'active' : ''}`}
              title="Highlight this verse"
              onClick={() => setMenuOpen((v) => !v)}
            >
              ✎
            </button>
            {menuOpen && (
              <span className="highlight-menu">
                {Object.entries(HIGHLIGHT_COLORS).map(([name, c]) => (
                  <button
                    key={name}
                    type="button"
                    className="highlight-swatch"
                    style={{ background: c.bg }}
                    title={c.label}
                    onClick={() => {
                      onSetHighlight(name)
                      setMenuOpen(false)
                    }}
                  />
                ))}
                <button
                  type="button"
                  className="highlight-swatch highlight-clear"
                  title="Clear highlight"
                  onClick={() => {
                    onSetHighlight(null)
                    setMenuOpen(false)
                  }}
                >
                  ✕
                </button>
              </span>
            )}
          </span>
        </span>
      </p>
    </span>
  )
}
