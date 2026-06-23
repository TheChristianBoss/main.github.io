import React, { useState, useEffect, useCallback } from 'react'
import { STATUS } from '../data/catalog.js'
import { isJesusVerse } from '../utils/jesusVerses.js'
import { verseKey } from '../utils/verseKey.js'
import { loadStrongsDictionary, tagNumber } from '../utils/strongs.js'
import VerseLine from './VerseLine.jsx'
import StrongsPopup from './StrongsPopup.jsx'
import CrossReferencesPanel from './CrossReferencesPanel.jsx'
import ShareVerseModal from './ShareVerseModal.jsx'
import InterlinearView from './InterlinearView.jsx'
import { useSwipeNavigation } from '../utils/useSwipeNavigation.js'
import { getNextChapterRef, getPrevChapterRef } from '../utils/bookOrder.js'
import { getVerses } from '../utils/reference.js'

const pillClass = {
  [STATUS.OPEN]: 'open',
  [STATUS.PENDING]: 'pending',
  [STATUS.RESTRICTED]: 'restricted',
}

const pillLabel = {
  [STATUS.OPEN]: 'Verified open license',
  [STATUS.PENDING]: 'Pending license review',
  [STATUS.RESTRICTED]: 'Restricted - see source',
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
  onSavePassageBookmark,
  onSetHighlight,
  onWordClick,
  onShowCrossRefs,
  onShareVerse,
}) {
  if (translation.status !== STATUS.OPEN) {
    return <LicenseNote translation={translation} />
  }
  const hasStrongs = !!translation.hasStrongs
  return (
    <div className="verse-block" style={{ fontSize: settings.fontSize }}>
      {loading && <p>Loading...</p>}
      {!loading && verses.length === 0 && (
        <div className="empty-state">
          No text found for this reference in {translation.name}. Try a
          different book or chapter - this translation's data file may not
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
              onShowCrossRefs={onShowCrossRefs}
              onShareVerse={onShareVerse}
            />
          )
        })}
    </div>
  )
}

export default function ReadingPane({
  translation,
  textData,
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
  onNavigateToVerse,
  onNextChapter,
  onPrevChapter,
}) {
  const [strongsDict, setStrongsDict] = useState(null)
  const [popup, setPopup] = useState(null) // { word, tags, position }
  const [crossRefTarget, setCrossRefTarget] = useState(null) // { book, chapter, verse, position }
  const [shareVerse, setShareVerse] = useState(null) // { book, chapter, verse, text }
  const [interlinearOpen, setInterlinearOpen] = useState(false)

  const hasStrongs = !!translation?.hasStrongs || !!compareTranslation?.hasStrongs

  useEffect(() => {
    setPopup(null)
    setCrossRefTarget(null)
    setInterlinearOpen(false)
    if (hasStrongs) {
      loadStrongsDictionary().then(setStrongsDict)
    }
  }, [hasStrongs, translation?.id, compareTranslation?.id])

  const openPopup = useCallback(({ word, tags, position }) => {
    setPopup({ word, tags, position })
  }, [])

  const closePopup = useCallback(() => setPopup(null), [])

  const handleNavigateCrossRef = useCallback(
    (ref) => {
      setCrossRefTarget(null)
      onNavigateToVerse?.(ref)
    },
    [onNavigateToVerse]
  )

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

  const fullChapterVerses = textData
    ? getVerses(textData.books, { book: refLabel.book, chapter: refLabel.chapter })
        .map((v) => ({ ...v, book: refLabel.book, chapter: refLabel.chapter }))
    : stamped

  const stampedCompare = compareVerses
    ? compareVerses.map((v) => ({ ...v, book: refLabel.book, chapter: refLabel.chapter }))
    : null

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: onNextChapter,
    onSwipeRight: onPrevChapter,
  })

  const hasNextChapter = !!getNextChapterRef(refLabel.book, refLabel.chapter)
  const hasPrevChapter = !!getPrevChapterRef(refLabel.book, refLabel.chapter)

  return (
    <div className="reading-pane" {...swipeHandlers}>
      {onPrevChapter && hasPrevChapter && (
        <button
          type="button"
          className="chapter-edge-nav chapter-edge-nav-prev"
          onClick={onPrevChapter}
          aria-label="Previous chapter"
          title="Previous chapter"
          >
            {"<"}
        </button>
      )}
      {onNextChapter && hasNextChapter && (
        <button
          type="button"
          className="chapter-edge-nav chapter-edge-nav-next"
          onClick={onNextChapter}
          aria-label="Next chapter"
          title="Next chapter"
          >
            {">"}
        </button>
      )}

      <div className="reading-header">
        <div>
          <div className="reading-ref">{refLabel.text}</div>
          <div className="reading-translation-name">
            {translation.name}
            {compareTranslation && <> &nbsp;vs.&nbsp; {compareTranslation.name}</>}
          </div>
        </div>
        <div className="reading-header-actions">
          {onPrevChapter && (
            <button
              type="button"
              className="top-nav-toggle"
              onClick={onPrevChapter}
              disabled={!hasPrevChapter}
          >
              {"< Prev"}
            </button>
          )}
          {onNextChapter && (
            <button
              type="button"
              className="top-nav-toggle"
              onClick={onNextChapter}
              disabled={!hasNextChapter}
          >
              {"Next >"}
            </button>
          )}
          <button
            type="button"
            className={`top-nav-toggle ${interlinearOpen ? 'active' : ''}`}
            onClick={() => setInterlinearOpen((v) => !v)}
          >
            {interlinearOpen ? 'Hide interlinear' : 'Interlinear'}
          </button>
          {onSavePassageBookmark && stamped.length > 0 && (
            <button
              type="button"
              className="top-nav-toggle"
              onClick={() => onSavePassageBookmark({ translation, verses: stamped, scope: 'shown' })}
            >
              Bookmark shown verses
            </button>
          )}
          {onSavePassageBookmark && fullChapterVerses.length > 0 && (
            <button
              type="button"
              className="top-nav-toggle"
              onClick={() => onSavePassageBookmark({ translation, verses: fullChapterVerses, scope: 'chapter' })}
            >
              Bookmark full chapter
            </button>
          )}
        </div>
      </div>

      {interlinearOpen && (
        <InterlinearView
          book={refLabel.book}
          chapter={refLabel.chapter}
          verses={stamped}
          activeHasStrongs={hasStrongs}
        />
      )}

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
              onShowCrossRefs={setCrossRefTarget}
              onShareVerse={setShareVerse}
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
              onShowCrossRefs={setCrossRefTarget}
              onShareVerse={setShareVerse}
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
          onShowCrossRefs={setCrossRefTarget}
          onShareVerse={setShareVerse}
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

      {crossRefTarget && (
        <CrossReferencesPanel
          book={crossRefTarget.book}
          chapter={crossRefTarget.chapter}
          verse={crossRefTarget.verse}
          position={crossRefTarget.position}
          onNavigate={handleNavigateCrossRef}
          onClose={() => setCrossRefTarget(null)}
        />
      )}

      {shareVerse && (
        <ShareVerseModal
          verse={shareVerse}
          shownVerses={stamped}
          chapterVerses={fullChapterVerses}
          translationName={translation.name}
          translationId={translation.id}
          highlights={highlights}
          onClose={() => setShareVerse(null)}
        />
      )}
    </div>
  )
}



