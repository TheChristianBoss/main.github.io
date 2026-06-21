import React, { useEffect, useState } from 'react'
import { loadOriginalLanguageVerse } from '../utils/interlinear.js'
import { loadStrongsDictionary, tagNumber, parseStrongsText } from '../utils/strongs.js'

const MORPH_LABELS = {
  N: 'Noun', V: 'Verb', A: 'Adjective', T: 'Article', P: 'Pronoun',
  D: 'Demonstrative', C: 'Conjunction', CONJ: 'Conjunction', PREP: 'Preposition',
  ADV: 'Adverb', PRT: 'Particle', I: 'Interrogative', R: 'Relative pronoun',
  X: 'Indeclinable', HEB: 'Transliterated Hebrew', ARAM: 'Transliterated Aramaic',
}

function morphLabel(code) {
  if (!code) return null
  const head = code.split('-')[0]
  return MORPH_LABELS[head] || code
}

function GreekWord({ word, strongsNumbers, parsing, strongsDict }) {
  const lemmaNum = strongsNumbers.find((n) => strongsDict?.[n]?.type === 'word') || strongsNumbers[0]
  const entry = lemmaNum ? strongsDict?.[lemmaNum] : null
  const [open, setOpen] = useState(false)

  if (!lemmaNum && !parsing) {
    // A handful of words in the source data (transliterated idioms,
    // stray variant-reading markers) carry no tag at all -- show plainly.
    return <span className="interlinear-word interlinear-word-plain">{word}</span>
  }

  return (
    <span className="interlinear-word" onClick={() => setOpen((v) => !v)}>
      <span className="interlinear-greek">{word}</span>
      {entry?.transliteration && (
        <span className="interlinear-translit">{entry.transliteration}</span>
      )}
      <span className="interlinear-gloss">
        {entry?.root_word ? stripTags(entry.entry).slice(0, 40) : lemmaNum}
      </span>
      <span className="interlinear-morph">{morphLabel(parsing)}</span>
      {open && entry && (
        <span className="interlinear-detail">
          <strong>{lemmaNum}</strong>{' '}
          <span dangerouslySetInnerHTML={{ __html: entry.entry || '' }} />
        </span>
      )}
    </span>
  )
}

function stripTags(html) {
  return html ? html.replace(/<[^>]+>/g, '') : ''
}

function HebrewVerseFallback({ verse, strongsDict }) {
  const hasStrongsText = verse.activeHasStrongs && verse.activeText
  return (
    <div className="interlinear-verse">
      <div className="interlinear-verse-num">
        {verse.book} {verse.chapter}:{verse.verse}
      </div>
      <div className="interlinear-hebrew-line" dir="rtl" lang="he">
        {verse.hebrewText}
      </div>
      {hasStrongsText ? (
        <div className="interlinear-words-row">
          {parseStrongsText(verse.activeText).map((seg, i) =>
            seg.type === 'word' && seg.tags.length > 0 ? (
              <GreekWord
                key={i}
                word={seg.text}
                strongsNumbers={seg.tags.map(tagNumber)}
                parsing={null}
                strongsDict={strongsDict}
              />
            ) : null
          )}
        </div>
      ) : (
        <div className="interlinear-note">
          No word-level Hebrew data available in this library yet — showing
          the verse text only. Switch to a Strong's-tagged translation
          (e.g. KJV with Strong's) to see tagged English words alongside it.
        </div>
      )}
    </div>
  )
}

/**
 * Shows the original-language text for the current passage. NT books get
 * a real word-by-word interlinear (Greek + Strong's + parsing, in
 * original word order, from tr-parsed-nt.json). OT books fall back to a
 * verse-level view: WLC Hebrew text plus the active translation's
 * Strong's-tagged English, since this library has no per-word-tagged
 * Hebrew source to build a true interlinear from.
 */
export default function InterlinearView({ book, chapter, verses, activeHasStrongs }) {
  const [data, setData] = useState({}) // verse -> { kind, words } | { kind, text }
  const [strongsDict, setStrongsDict] = useState(null)

  useEffect(() => {
    loadStrongsDictionary().then(setStrongsDict)
  }, [])

  useEffect(() => {
    let cancelled = false
    setData({})
    Promise.all(
      verses.map((v) =>
        loadOriginalLanguageVerse(book, chapter, v.verse).then((result) => [v.verse, result])
      )
    ).then((results) => {
      if (cancelled) return
      const next = {}
      for (const [verseNum, result] of results) next[verseNum] = result
      setData(next)
    })
    return () => {
      cancelled = true
    }
  }, [book, chapter, verses])

  if (!verses.length) return null

  return (
    <div className="interlinear-view">
      {!strongsDict && <div className="interlinear-loading">Loading interlinear data…</div>}
      {strongsDict &&
        verses.map((v) => {
          const result = data[v.verse]
          if (!result) {
            return (
              <div key={v.verse} className="interlinear-verse interlinear-loading">
                {v.book} {v.chapter}:{v.verse} — loading…
              </div>
            )
          }
          if (result.kind === 'greek') {
            return (
              <div key={v.verse} className="interlinear-verse">
                <div className="interlinear-verse-num">
                  {v.book} {v.chapter}:{v.verse}
                </div>
                <div className="interlinear-words-row" dir="ltr">
                  {result.words.map((w, i) => (
                    <GreekWord
                      key={i}
                      word={w.word}
                      strongsNumbers={w.strongsNumbers}
                      parsing={w.parsing}
                      strongsDict={strongsDict}
                    />
                  ))}
                </div>
              </div>
            )
          }
          return (
            <HebrewVerseFallback
              key={v.verse}
              verse={{
                book: v.book,
                chapter: v.chapter,
                verse: v.verse,
                hebrewText: result.text,
                activeHasStrongs,
                activeText: v.text,
              }}
              strongsDict={strongsDict}
            />
          )
        })}
    </div>
  )
}
