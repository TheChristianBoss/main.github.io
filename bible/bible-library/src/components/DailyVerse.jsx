import React, { useState, useEffect, useCallback } from 'react'
import { parseStrongsText, loadStrongsDictionary, tagNumber } from '../utils/strongs.js'
import StrongsPopup from './StrongsPopup.jsx'

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

function DailyVerseText({ text, hasStrongs, onWordClick }) {
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

export default function DailyVerse({ verse, translationName, hasStrongs, onDismiss, onOpen, onShare }) {
  const [strongsDict, setStrongsDict] = useState(null)
  const [popup, setPopup] = useState(null) // { word, tags, position }

  useEffect(() => {
    setPopup(null)
    if (hasStrongs) {
      loadStrongsDictionary().then(setStrongsDict)
    }
  }, [hasStrongs, verse?.book, verse?.chapter, verse?.verse])

  const openPopup = useCallback(({ word, tags, position }) => {
    setPopup({ word, tags, position })
  }, [])

  const closePopup = useCallback(() => setPopup(null), [])

  if (!verse) return null

  const popupEntries = popup
    ? popup.tags.map((tag) => {
        const num = tagNumber(tag)
        return { number: num, entry: strongsDict ? strongsDict[num] || null : null }
      })
    : []

  return (
    <div className="daily-verse">
      <div className="daily-verse-label">Verse of the day</div>
      <p className="daily-verse-text">
        “<DailyVerseText text={verse.text} hasStrongs={hasStrongs} onWordClick={openPopup} />”
        <span className="daily-verse-ref">
          {' '}
          — {verse.book} {verse.chapter}:{verse.verse}
        </span>
      </p>
      <div className="daily-verse-actions">
        <button type="button" className="go-btn" onClick={onOpen}>
          Read in context
        </button>
        {onShare && (
          <button type="button" className="go-btn" onClick={() => onShare(verse)}>
            Share
          </button>
        )}
        <button type="button" className="daily-verse-dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
      <div className="daily-verse-meta">{translationName}</div>

      {popup && (
        <StrongsPopup
          word={popup.word}
          entries={popupEntries}
          position={popup.position}
          onClose={closePopup}
        />
      )}
    </div>
  )
}
