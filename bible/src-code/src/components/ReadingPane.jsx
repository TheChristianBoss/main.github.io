import React, { useState, useEffect, useCallback } from 'react'
import { STATUS } from '../data/catalog.js'
import { isJesusVerse } from '../utils/jesusVerses.js'
import { verseKey } from '../utils/verseKey.js'
import { loadStrongsDictionary, tagNumber } from '../utils/strongs.js'
import VerseLine from './VerseLine.jsx'
import StrongsPopup from './StrongsPopup.jsx'

const pillClass = {
  [STATUS.OPEN]: 'open',
  [STATUS.PENDING]: 'pending',
  [STATUS.RESTRICTED]: 'restricted',
}

const pillLabel = {
  [STATUS.OPEN]: 'Verified open license',
  [STATUS.PENDING]: 'Pending license review',
  [STATUS.RESTRICTED]: 'Restricted — see source',
}

function LicenseNote({ translation }) {
  if (translation.status === STATUS.PENDING) {
    return (
      <div className="empty-state" style={{ marginTop: 20 }}>
        <strong>{translation.name}</strong> is in the catalog, but its license
        hasn't been confirmed yet, so the text isn't available here. Once it's
        verified as public domain or openly licensed, this page will show the
        full text automatically.
      </div>
    )
  }
  if (translation.status === STATUS.RESTRICTED) {
    return (
      <div className="empty-state" style={{ marginTop: 20 }}>
        <strong>{translation.name}</strong> is copyrighted: {translation.license}.
        {translation.note && <> {translation.note}</>}
        {translation.licenseUrl && (
          <>
            {' '}
            <a href={translation.licenseUrl} target="_blank" rel="noreferrer">
              View at the official source
            </a>
            .
          </>
        )}
      </div>
    )
  }
  return null
}

function VerseColumn({
  translation,
  verses,
  loading,
  settings,
  bookmarkSet,
  highlights,
  onToggleBookmark,
  onSetHighlight,
  onWordClick,
}) {
  if (translation.status !== STATUS.OPEN) {
    return <LicenseNote translation={translation} />
  }
  const hasStrongs = !!translation.hasStrongs
  return (
    <div className="verse-block" style={{ fontSize: settings.fontSize }}>
      {loading && <p>Loading…</p>}
      {!loading && verses.length === 0 && (
        <div className="empty-state">
          No text found for this reference in {translation.name}. Try a
          different book or chapter — this translation's data file may not
          include every passage yet.
        </div>
      )}
      {!loading &&
        verses.map((v) => {
          const key = verseKey(translation.id, v.book, v.chapter, v.verse)
          return (
            <VerseLine
              key={v.verse}
              book={v.book}
              chapter={v.chapter}
              verse={v.verse}
              text={v.text}
              isJesus={isJesusVerse(v.book, v.chapter, v.verse)}
              redLetterEnabled={settings.redLetterEnabled}
              redLetterColor={settings.redLetterColor}
              isBookmarked={bookmarkSet.has(key)}
              highlightColor={highlights[key]}
              onToggleBookmark={() => onToggleBookmark(translation, v)}
              onSetHighlight={(color) => onSetHighlight(key, color)}
              hasStrongs={hasStrongs}
              onWordClick={hasStrongs ? onWordClick : undefined}
            />
          )
        })}
    </div>
  )
}

export default function ReadingPane({
  translation,
  refLabel,
  verses,
  loading,
  settings,
  bookmarkSet,
  highlights,
  onToggleBookmark,
  onSetHighlight,
  compareTranslation,
  compareVerses,
  compareLoading,
}) {
  const [strongsDict, setStrongsDict] = useState(null)
  const [popup, setPopup] = useState(null) // { word, tags, position }

  const hasStrongs = !!translation?.hasStrongs || !!compareTranslation?.hasStrongs

  useEffect(() => {
    setPopup(null)
    if (hasStrongs) {
      loadStrongsDictionary().then(setStrongsDict)
    }
  }, [hasStrongs, translation?.id, compareTranslation?.id])

  const openPopup = useCallback(({ word, tags, position }) => {
    setPopup({ word, tags, position })
  }, [])

  const closePopup = useCallback(() => setPopup(null), [])

  const popupEntries = popup
    ? popup.tags.map((tag) => {
        const num = tagNumber(tag)
        return { number: num, entry: strongsDict ? strongsDict[num] || null : null }
      })
    : []

  if (!translation) {
    return (
      <div className="empty-state">
        Choose a translation from the list on the left to start reading.
      </div>
    )
  }

  // verses come in without book/chapter attached per-item from the parent's
  // getVerses() helper, so stamp them on here for the bookmark/highlight keys.
  const stamped = verses.map((v) => ({ ...v, book: refLabel.book, chapter: refLabel.chapter }))
  const stampedCompare = compareVerses
    ? compareVerses.map((v) => ({ ...v, book: refLabel.book, chapter: refLabel.chapter }))
    : null

  return (
    <div>
      <div className="reading-header">
        <div>
          <div className="reading-ref">{refLabel.text}</div>
          <div className="reading-translation-name">
            {translation.name}
            {compareTranslation && <> &nbsp;vs.&nbsp; {compareTranslation.name}</>}
          </div>
        </div>
      </div>

      <span className={`license-pill ${pillClass[translation.status]}`}>
        {pillLabel[translation.status]}
      </span>
      {compareTranslation && (
        <span className={`license-pill ${pillClass[compareTranslation.status]}`} style={{ marginLeft: 6 }}>
          {compareTranslation.name}: {pillLabel[compareTranslation.status]}
        </span>
      )}

      {compareTranslation ? (
        <div className="compare-grid">
          <div>
            <div className="compare-col-title">{translation.name}</div>
            <VerseColumn
              translation={translation}
              verses={stamped}
              loading={loading}
              settings={settings}
              bookmarkSet={bookmarkSet}
              highlights={highlights}
              onToggleBookmark={onToggleBookmark}
              onSetHighlight={onSetHighlight}
              onWordClick={openPopup}
            />
          </div>
          <div>
            <div className="compare-col-title">{compareTranslation.name}</div>
            <VerseColumn
              translation={compareTranslation}
              verses={stampedCompare || []}
              loading={compareLoading}
              settings={settings}
              bookmarkSet={bookmarkSet}
              highlights={highlights}
              onToggleBookmark={onToggleBookmark}
              onSetHighlight={onSetHighlight}
              onWordClick={openPopup}
            />
          </div>
        </div>
      ) : (
        <VerseColumn
          translation={translation}
          verses={stamped}
          loading={loading}
          settings={settings}
          bookmarkSet={bookmarkSet}
          highlights={highlights}
          onToggleBookmark={onToggleBookmark}
          onSetHighlight={onSetHighlight}
          onWordClick={openPopup}
        />
      )}

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
