import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { translations, STATUS } from './data/catalog.js'
import { loadTranslationText } from './utils/loadTranslation.js'
import { parseReference, getVerses, formatReference } from './utils/reference.js'
import { searchTranslation } from './utils/search.js'
import { usePersistentState } from './utils/storage.js'
import { verseKey } from './utils/verseKey.js'
import { pickDailyVerse } from './utils/dailyVerse.js'
import { DEFAULT_RED } from './components/ReaderSettingsControl.jsx'

import TranslationSwitcher from './components/TranslationSwitcher.jsx'
import BookChapterPicker from './components/BookChapterPicker.jsx'
import ReadingPane from './components/ReadingPane.jsx'
import SearchResults from './components/SearchResults.jsx'
import CatalogPage from './components/CatalogPage.jsx'
import ReaderSettingsControl from './components/ReaderSettingsControl.jsx'
import DailyVerse from './components/DailyVerse.jsx'
import BookmarksPanel from './components/BookmarksPanel.jsx'

function sortByLanguageThenName(list) {
  return [...list].sort((a, b) => {
    const langCmp = a.language.localeCompare(b.language)
    if (langCmp !== 0) return langCmp
    return a.name.localeCompare(b.name)
  })
}

// Display order everywhere in the UI: alphabetical by language, then name.
const sortedTranslations = sortByLanguageThenName(translations)
const openTranslations = sortedTranslations.filter((t) => t.status === STATUS.OPEN)
const strongsTranslations = sortedTranslations.filter((t) => t.hasStrongs)

// First-time default (no saved reading position yet): the (non-Strong's)
// English KJV if present, else just the first open translation in the
// sorted list.
const defaultTranslation =
  openTranslations.find((t) => t.id === 'kjv') || openTranslations[0] || null

const DEFAULT_SETTINGS = {
  fontSize: 19,
  redLetterEnabled: true,
  redLetterColor: DEFAULT_RED,
}

const HISTORY_LIMIT = 30

export default function App() {
  // ---- persisted reader state -------------------------------------------
  const [lastPosition, setLastPosition] = usePersistentState('last-position', null)
  const [history, setHistory] = usePersistentState('history', [])
  const [bookmarks, setBookmarks] = usePersistentState('bookmarks', [])
  const [highlights, setHighlights] = usePersistentState('highlights', {})
  const [settings, setSettings] = usePersistentState('settings', DEFAULT_SETTINGS)
  const [dailyVerseDismissedDate, setDailyVerseDismissedDate] = usePersistentState(
    'daily-verse-dismissed',
    null
  )

  // ---- view / navigation state -------------------------------------------
  const [view, setView] = useState('read') // 'read' | 'catalog' | 'strongs' | 'bookmarks'
  const [activeId, setActiveId] = useState(
    lastPosition?.translationId ?? defaultTranslation?.id ?? null
  )
  const [book, setBook] = useState(lastPosition?.book ?? 'Genesis')
  const [chapter, setChapter] = useState(lastPosition?.chapter ?? 1)
  const [verseRangeInput, setVerseRangeInput] = useState('')
  const [refInput, setRefInput] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState(null)

  const [textData, setTextData] = useState(null)
  const [loading, setLoading] = useState(false)

  // ---- side-by-side compare -----------------------------------------------
  const [compareId, setCompareId] = useState('')
  const [compareTextData, setCompareTextData] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)

  // ---- daily verse ---------------------------------------------------------
  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  }, [])
  const [showDailyVerse, setShowDailyVerse] = useState(dailyVerseDismissedDate !== todayStr)

  const activeTranslation = useMemo(
    () => translations.find((t) => t.id === activeId) || null,
    [activeId]
  )
  const compareTranslation = useMemo(
    () => translations.find((t) => t.id === compareId) || null,
    [compareId]
  )

  // Load verse data whenever the active translation changes
  useEffect(() => {
    if (!activeTranslation || activeTranslation.status !== STATUS.OPEN) {
      setTextData(null)
      return
    }
    setLoading(true)
    loadTranslationText(activeTranslation.file).then((data) => {
      setTextData(data)
      setLoading(false)
    })
  }, [activeTranslation])

  // Load verse data for the compare translation
  useEffect(() => {
    if (!compareTranslation || compareTranslation.status !== STATUS.OPEN) {
      setCompareTextData(null)
      return
    }
    setCompareLoading(true)
    loadTranslationText(compareTranslation.file).then((data) => {
      setCompareTextData(data)
      setCompareLoading(false)
    })
  }, [compareTranslation])

  // Build the current reference from book/chapter/verseRangeInput
  const currentRef = useMemo(() => {
    let str = `${book} ${chapter}`
    if (verseRangeInput.trim()) str += `:${verseRangeInput.trim()}`
    return parseReference(str)
  }, [book, chapter, verseRangeInput])

  const verses = useMemo(() => {
    if (!textData || !currentRef) return []
    return getVerses(textData.books, currentRef)
  }, [textData, currentRef])

  const compareVerses = useMemo(() => {
    if (!compareTextData || !currentRef) return []
    return getVerses(compareTextData.books, currentRef)
  }, [compareTextData, currentRef])

  // ---- reading history: remember position + recently visited chapters -----
  useEffect(() => {
    if (!activeId || view !== 'read') return
    setLastPosition({ translationId: activeId, book, chapter })
    setHistory((prev) => {
      const entry = { translationId: activeId, book, chapter, visitedAt: Date.now() }
      const withoutDup = prev.filter(
        (h) => !(h.translationId === activeId && h.book === book && h.chapter === chapter)
      )
      return [entry, ...withoutDup].slice(0, HISTORY_LIMIT)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, book, chapter, view])

  const handleGoToReference = useCallback(() => {
    const parsed = parseReference(refInput)
    if (!parsed) return
    setBook(parsed.book)
    setChapter(parsed.chapter)
    setVerseRangeInput(
      parsed.verseStart
        ? parsed.verseEnd && parsed.verseEnd !== parsed.verseStart
          ? `${parsed.verseStart}-${parsed.verseEnd}`
          : `${parsed.verseStart}`
        : ''
    )
    setSearchResults(null)
    setView('read')
  }, [refInput])

  const handleSearch = useCallback(() => {
    if (!textData || !searchInput.trim()) {
      setSearchResults(null)
      return
    }
    const results = searchTranslation(textData.books, searchInput)
    setSearchResults(results)
    setView('read')
  }, [textData, searchInput])

  const handlePickSearchResult = useCallback((r) => {
    setBook(r.book)
    setChapter(r.chapter)
    setVerseRangeInput(String(r.verse))
    setSearchResults(null)
  }, [])

  const handleSelectFromCatalog = useCallback((id) => {
    setActiveId(id)
    setView('read')
    setSearchResults(null)
  }, [])

  // ---- bookmarks ------------------------------------------------------------
  const bookmarkSet = useMemo(() => new Set(bookmarks.map((b) => b.key)), [bookmarks])

  const handleToggleBookmark = useCallback(
    (translation, v) => {
      const key = verseKey(translation.id, v.book, v.chapter, v.verse)
      setBookmarks((prev) => {
        if (prev.some((b) => b.key === key)) {
          return prev.filter((b) => b.key !== key)
        }
        return [
          ...prev,
          {
            key,
            translationId: translation.id,
            translationName: translation.name,
            book: v.book,
            chapter: v.chapter,
            verse: v.verse,
            text: v.text,
            addedAt: Date.now(),
          },
        ]
      })
    },
    [setBookmarks]
  )

  const handleRemoveBookmark = useCallback(
    (key) => setBookmarks((prev) => prev.filter((b) => b.key !== key)),
    [setBookmarks]
  )

  const handleOpenBookmark = useCallback((b) => {
    setActiveId(b.translationId)
    setBook(b.book)
    setChapter(Number(b.chapter))
    setVerseRangeInput(String(b.verse))
    setSearchResults(null)
    setView('read')
  }, [])

  // ---- highlights -------------------------------------------------------------
  const handleSetHighlight = useCallback(
    (key, color) => {
      setHighlights((prev) => {
        if (!color) {
          const { [key]: _omit, ...rest } = prev
          return rest
        }
        return { ...prev, [key]: color }
      })
    },
    [setHighlights]
  )

  // ---- daily verse --------------------------------------------------------
  const dailyVerse = useMemo(() => {
    if (!textData) return null
    return pickDailyVerse(textData.books, activeId)
  }, [textData, activeId])

  const handleDismissDailyVerse = useCallback(() => {
    setShowDailyVerse(false)
    setDailyVerseDismissedDate(todayStr)
  }, [todayStr, setDailyVerseDismissedDate])

  const handleOpenDailyVerse = useCallback(() => {
    if (!dailyVerse) return
    setBook(dailyVerse.book)
    setChapter(Number(dailyVerse.chapter))
    setVerseRangeInput(String(dailyVerse.verse))
    setShowDailyVerse(false)
    setDailyVerseDismissedDate(todayStr)
  }, [dailyVerse, todayStr, setDailyVerseDismissedDate])

  const refLabel = {
    text: formatReference(currentRef) || `${book} ${chapter}`,
    book,
    chapter,
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">Open Bible Library</span>
        </div>

        <nav className="top-nav" style={{ marginBottom: 20 }}>
          <button className={view === 'read' ? 'active' : ''} onClick={() => setView('read')}>
            Read
          </button>
          <button className={view === 'bookmarks' ? 'active' : ''} onClick={() => setView('bookmarks')}>
            Bookmarks ({bookmarks.length})
          </button>
          <button className={view === 'catalog' ? 'active' : ''} onClick={() => setView('catalog')}>
            All translations ({translations.length})
          </button>
          <button className={view === 'strongs' ? 'active' : ''} onClick={() => setView('strongs')}>
            Strong's translations ({strongsTranslations.length})
          </button>
        </nav>

        <div className="sidebar-section">
          <label className="sidebar-label" htmlFor="ref-go">Go to a passage</label>
          <div className="ref-row">
            <input
              id="ref-go"
              className="ref-input"
              placeholder="e.g. Genesis 1:1-9"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGoToReference()}
            />
            <button className="go-btn" onClick={handleGoToReference}>Go</button>
          </div>
          <div className="hint">Or browse by book and chapter:</div>
          <BookChapterPicker
            book={book}
            chapter={chapter}
            onChange={({ book: b, chapter: c }) => {
              setBook(b)
              setChapter(c)
              setVerseRangeInput('')
              setSearchResults(null)
            }}
          />
          <input
            className="search-box"
            style={{ marginTop: 8 }}
            placeholder="Verse range, e.g. 1-9 (optional)"
            value={verseRangeInput}
            onChange={(e) => setVerseRangeInput(e.target.value)}
          />
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label" htmlFor="kw-search">Search this translation</label>
          <div className="ref-row">
            <input
              id="kw-search"
              className="ref-input"
              placeholder="Search a word or phrase…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="go-btn" onClick={handleSearch}>Find</button>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-label">Translation</span>
          <TranslationSwitcher
            translations={sortedTranslations}
            activeId={activeId}
            onSelect={(id) => {
              setActiveId(id)
              setSearchResults(null)
            }}
          />
        </div>

        <div className="sidebar-section">
          <label className="sidebar-label" htmlFor="compare-select">
            Compare with (optional)
          </label>
          <select
            id="compare-select"
            className="picker"
            style={{ width: '100%' }}
            value={compareId}
            onChange={(e) => setCompareId(e.target.value)}
          >
            <option value="">— None —</option>
            {sortedTranslations
              .filter((t) => t.id !== activeId)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.language})
                </option>
              ))}
          </select>
        </div>

        <ReaderSettingsControl settings={settings} onChange={setSettings} />

        {history.length > 0 && (
          <div className="sidebar-section">
            <span className="sidebar-label">Recently read</span>
            <div className="history-list">
              {history.slice(0, 6).map((h) => (
                <button
                  key={`${h.translationId}-${h.book}-${h.chapter}-${h.visitedAt}`}
                  className="history-item"
                  onClick={() => {
                    setActiveId(h.translationId)
                    setBook(h.book)
                    setChapter(h.chapter)
                    setVerseRangeInput('')
                    setSearchResults(null)
                    setView('read')
                  }}
                >
                  {h.book} {h.chapter}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className={`main-pane${compareTranslation ? ' main-pane-wide' : ''}`}>
        {view === 'catalog' ? (
          <CatalogPage translations={sortedTranslations} onRead={handleSelectFromCatalog} />
        ) : view === 'strongs' ? (
          <CatalogPage
            translations={strongsTranslations}
            onRead={handleSelectFromCatalog}
            title="Strong's translations"
            description={
              <>
                {strongsTranslations.length} translations include Strong's numbers, so you
                can tap any tagged word while reading to see its underlying Hebrew or Greek
                definition. They're also listed in the full translation list above.
              </>
            }
          />
        ) : view === 'bookmarks' ? (
          <BookmarksPanel
            bookmarks={bookmarks}
            onOpen={handleOpenBookmark}
            onRemove={handleRemoveBookmark}
          />
        ) : searchResults ? (
          <SearchResults
            results={searchResults}
            query={searchInput}
            translationName={activeTranslation?.name}
            onPick={handlePickSearchResult}
          />
        ) : (
          <>
            {showDailyVerse && dailyVerse && (
              <DailyVerse
                verse={dailyVerse}
                translationName={activeTranslation?.name}
                hasStrongs={!!activeTranslation?.hasStrongs}
                onDismiss={handleDismissDailyVerse}
                onOpen={handleOpenDailyVerse}
              />
            )}
            <ReadingPane
              translation={activeTranslation}
              refLabel={refLabel}
              verses={verses}
              loading={loading}
              settings={settings}
              bookmarkSet={bookmarkSet}
              highlights={highlights}
              onToggleBookmark={handleToggleBookmark}
              onSetHighlight={handleSetHighlight}
              compareTranslation={compareTranslation}
              compareVerses={compareVerses}
              compareLoading={compareLoading}
            />
          </>
        )}
      </main>
    </div>
  )
}
