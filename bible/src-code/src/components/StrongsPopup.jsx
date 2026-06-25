import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * One entry's worth of content inside the popup. `entry` is a record from
 * strongs.json — either a word entry ({type:'word', root_word, ...}) or a
 * grammar/TVM entry ({type:'grammar', stem, mood, count}) or a rare note
 * entry ({type:'note', title, note}).
 */
function StrongsEntryView({ entry, number }) {
  if (!entry) {
    return (
      <div className="strongs-entry strongs-entry-missing">
        <div className="strongs-entry-number">{number}</div>
        <div className="strongs-entry-definition">No definition found for this reference.</div>
      </div>
    )
  }

  if (entry.type === 'grammar') {
    return (
      <div className="strongs-entry strongs-entry-grammar">
        <div className="strongs-entry-number">{entry.number}</div>
        <div className="strongs-grammar-row">
          {entry.stem && <span><strong>Stem:</strong> {entry.stem}</span>}
          {entry.mood && <span><strong>Mood:</strong> {entry.mood}</span>}
        </div>
      </div>
    )
  }

  if (entry.type === 'note') {
    return (
      <div className="strongs-entry strongs-entry-note">
        <div className="strongs-entry-number">{entry.number}</div>
        {entry.title && <div className="strongs-entry-title">{entry.title}</div>}
        <div className="strongs-entry-definition">{entry.note}</div>
      </div>
    )
  }

  // type === 'word'
  return (
    <div className="strongs-entry">
      <div className="strongs-entry-header">
        <span className="strongs-entry-number">{entry.number}</span>
        {entry.root_word && <span className="strongs-entry-root">{entry.root_word}</span>}
      </div>
      {(entry.transliteration || entry.pronunciation) && (
        <div className="strongs-entry-translit">
          {entry.transliteration}
          {entry.pronunciation && <span className="strongs-entry-pron"> ({entry.pronunciation})</span>}
        </div>
      )}
      {entry.entry && (
        <div
          className="strongs-entry-definition"
          dangerouslySetInnerHTML={{ __html: entry.entry }}
        />
      )}
    </div>
  )
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function StrongsPopup({ word, entries, position, onClose }) {
  const popupRef = useRef(null)
  const [coords, setCoords] = useState(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClickAway = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    // Capture phase + slight delay so the click that opened the popup
    // doesn't immediately close it.
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handleClickAway)
    }, 0)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickAway)
      clearTimeout(t)
    }
  }, [onClose])

  useLayoutEffect(() => {
    if (!position) return undefined

    const placePopup = () => {
      const popup = popupRef.current
      if (!popup) return

      const margin = 12
      const gap = 8
      const width = popup.offsetWidth || Math.min(360, window.innerWidth - margin * 2)
      const height = popup.offsetHeight || Math.min(420, window.innerHeight - margin * 2)

      // Callers store document coordinates. Fixed positioning needs viewport coordinates.
      const desiredLeft = Number(position.left || 0) - window.scrollX
      const desiredTop = Number(position.top || 0) - window.scrollY

      let left = clamp(desiredLeft, margin, Math.max(margin, window.innerWidth - width - margin))
      let top = desiredTop

      // Prefer below the clicked word, but keep the whole panel visible. If there
      // is not enough space below, place it higher instead of letting it run offscreen.
      if (top + height > window.innerHeight - margin) {
        top = window.innerHeight - height - margin
      }

      // If the popup was opened near the top, keep it on screen.
      top = clamp(top, margin, Math.max(margin, window.innerHeight - height - margin))

      // Nudge slightly away from the word when it has been clamped upward.
      if (top < desiredTop && desiredTop - height - gap >= margin) {
        top = desiredTop - height - gap
      }

      setCoords({ top, left })
    }

    placePopup()
    window.addEventListener('resize', placePopup)
    window.addEventListener('scroll', placePopup, true)
    return () => {
      window.removeEventListener('resize', placePopup)
      window.removeEventListener('scroll', placePopup, true)
    }
  }, [position])

  if (!position) return null

  return (
    <div
      ref={popupRef}
      className="strongs-popup"
      style={{
        top: coords ? coords.top : -9999,
        left: coords ? coords.left : -9999,
        visibility: coords ? 'visible' : 'hidden',
      }}
      role="dialog"
      aria-label={`Strong's definition for ${word}`}
    >
      <button className="strongs-popup-close" onClick={onClose} aria-label="Close">×</button>
      <div className="strongs-popup-word">{word}</div>
      {entries.map((item, i) => (
        <React.Fragment key={item.number || i}>
          {i > 0 && <hr className="strongs-entry-divider" />}
          <StrongsEntryView entry={item.entry} number={item.number} />
        </React.Fragment>
      ))}
    </div>
  )
}
