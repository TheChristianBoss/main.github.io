import React, { useEffect, useRef, useState } from 'react'
import { lookupCrossReferences, formatCrossRef } from '../utils/crossref.js'

/**
 * Anchored popover listing cross-references for one verse (openbible.info
 * data), ranked by relevance. Clicking a row navigates the reader there.
 */
export default function CrossReferencesPanel({ book, chapter, verse, position, onNavigate, onClose }) {
  const [refs, setRefs] = useState(null) // null = loading
  const panelRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setRefs(null)
    lookupCrossReferences(book, chapter, verse).then((result) => {
      if (!cancelled) setRefs(result)
    })
    return () => {
      cancelled = true
    }
  }, [book, chapter, verse])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClickAway = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    const t = setTimeout(() => document.addEventListener('mousedown', handleClickAway), 0)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickAway)
      clearTimeout(t)
    }
  }, [onClose])

  if (!position) return null

  return (
    <div
      ref={panelRef}
      className="crossref-panel"
      style={{ top: position.top, left: position.left }}
      role="dialog"
      aria-label={`Cross-references for ${book} ${chapter}:${verse}`}
    >
      <button className="strongs-popup-close" onClick={onClose} aria-label="Close">×</button>
      <div className="crossref-panel-title">
        Related to {book} {chapter}:{verse}
      </div>

      {refs === null && <div className="crossref-loading">Loading…</div>}

      {refs !== null && refs.length === 0 && (
        <div className="crossref-empty">No cross-references found for this verse.</div>
      )}

      {refs !== null && refs.length > 0 && (
        <ul className="crossref-list">
          {refs.slice(0, 30).map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="crossref-item"
                onClick={() => onNavigate(r)}
              >
                {formatCrossRef(r)}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="crossref-attribution">
        Cross-reference data &copy; <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noreferrer">openbible.info</a>, CC BY 4.0
      </div>
    </div>
  )
}
