import React, { useEffect, useState } from 'react'
import { loadOriginalLanguageVerse } from '../utils/interlinear.js'
import { loadTranslationText } from '../utils/loadTranslation.js'
import { loadStrongsDictionary, parseStrongsText, tagNumber } from '../utils/strongs.js'

const ALIGNMENT_TRANSLATION_ID = 'kjv-strongs'

const MORPH_LABELS = {
  N: 'Noun',
  V: 'Verb',
  A: 'Adjective',
  T: 'Article',
  P: 'Pronoun',
  D: 'Demonstrative',
  C: 'Conjunction',
  CONJ: 'Conjunction',
  PREP: 'Preposition',
  ADV: 'Adverb',
  PRT: 'Particle',
  I: 'Interrogative',
  R: 'Relative pronoun',
  X: 'Indeclinable',
  HEB: 'Transliterated Hebrew',
  ARAM: 'Transliterated Aramaic',
}

const HEB_MORPH_LABELS = {
  N: 'Noun',
  V: 'Verb',
  A: 'Adjective',
  T: 'Article',
  P: 'Pronoun',
  R: 'Preposition',
  C: 'Conjunction',
  D: 'Adverb',
  To: 'Direct object marker',
  Tn: 'Negative particle',
  Np: 'Proper noun',
  S: 'Suffix',
}

function morphLabel(code) {
  if (!code) return null

  if (code.startsWith('H')) {
    const rest = code.slice(1)
    const twoLetterHead = rest.slice(0, 2)
    return HEB_MORPH_LABELS[twoLetterHead] || HEB_MORPH_LABELS[rest[0]] || code
  }

  const head = code.split('-')[0]
  return MORPH_LABELS[head] || code
}

function stripTags(html) {
  return html ? html.replace(/<[^>]+>/g, '') : ''
}

function cleanVerseText(text) {
  return stripTags(text || '')
    .replace(/\{[^}]+\}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanWordText(text) {
  return cleanVerseText(text).replace(/^[.,;:!?'"“”‘’()[\]]+|[.,;:!?'"“”‘’()[\]]+$/g, '')
}

function englishWordsByStrong(text) {
  const map = new Map()
  let pendingPrefix = ''

  for (const segment of parseStrongsText(text || '')) {
    if (segment.type === 'text') {
      const cleaned = cleanVerseText(segment.content || '')
      pendingPrefix = cleaned || ''
      continue
    }

    if (segment.type !== 'word') continue

    const baseWord = cleanWordText(segment.text)
    if (!baseWord) {
      pendingPrefix = ''
      continue
    }

    const englishWord = pendingPrefix
      ? (pendingPrefix + ' ' + baseWord).replace(/\s+/g, ' ').trim()
      : baseWord

    pendingPrefix = ''

    for (const rawTag of segment.tags || []) {
      if (rawTag.startsWith('(')) continue

      const number = tagNumber(rawTag)
      if (!/^[HG]\d+$/.test(number)) continue

      if (!map.has(number)) map.set(number, [])

      const existing = map.get(number)
      if (!existing.includes(englishWord)) existing.push(englishWord)
    }
  }

  return map
}

function matchingEnglishWords(strongsNumbers, englishMap) {
  const words = []

  for (const strongsNumber of strongsNumbers || []) {
    const matches = englishMap.get(strongsNumber) || []

    for (const match of matches) {
      if (!words.includes(match)) words.push(match)
    }
  }

  return words
}

function displayEnglishLabel({
  language,
  originalWord,
  parsing,
  strongsNumbers,
  englishWords,
}) {
  if (language === 'hebrew' && strongsNumbers?.includes('H853')) {
    const hasConjunction = originalWord?.includes('/') || parsing?.startsWith('HC/')
    return hasConjunction ? 'and' : '—'
  }

  return englishWords.length ? englishWords.join(' / ') : '—'
}
function WordCard({
  originalWord,
  strongsNumbers,
  parsing,
  strongsDict,
  englishWords,
  language,
}) {
  const lemmaNum =
    language === 'greek'
      ? strongsNumbers.find((n) => strongsDict?.[n]?.type === 'word') || strongsNumbers[0]
      : strongsNumbers[0] || null

  const entry = lemmaNum ? strongsDict?.[lemmaNum] : null
  const [open, setOpen] = useState(false)

  if (!lemmaNum && !parsing) {
    return (
      <span className="interlinear-word interlinear-word-plain">
        <span className="interlinear-original-word">{originalWord}</span>
      </span>
    )
  }

  return (
    <span
      className="interlinear-word"
      onClick={() => lemmaNum && setOpen((v) => !v)}
      style={{ cursor: lemmaNum ? 'pointer' : 'default' }}
    >
      <span className="interlinear-english-word">
        {displayEnglishLabel({
          language,
          originalWord,
          parsing,
          strongsNumbers,
          englishWords,
        })}
      </span>

      <span
        className="interlinear-original-word"
        lang={language === 'hebrew' ? 'he' : 'el'}
        dir={language === 'hebrew' ? 'rtl' : 'ltr'}
      >
        {originalWord}
      </span>

      {entry?.transliteration && (
        <span className="interlinear-translit">{entry.transliteration}</span>
      )}

      <span className="interlinear-strongs">{lemmaNum}</span>

      <span className="interlinear-gloss">
        {entry?.entry ? stripTags(entry.entry).slice(0, 48) : ''}
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

export default function InterlinearView({ book, chapter, verses }) {
  const [data, setData] = useState({})
  const [strongsDict, setStrongsDict] = useState(null)
  const [alignmentData, setAlignmentData] = useState(null)

  useEffect(() => {
    let cancelled = false

    loadStrongsDictionary().then((dictionary) => {
      if (!cancelled) setStrongsDict(dictionary)
    })

    loadTranslationText(ALIGNMENT_TRANSLATION_ID).then((translationData) => {
      if (!cancelled) setAlignmentData(translationData)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setData({})

    Promise.all(
      verses.map((v) =>
        loadOriginalLanguageVerse(book, chapter, v.verse).then((result) => [
          v.verse,
          result,
        ])
      )
    ).then((results) => {
      if (cancelled) return

      const next = {}
      for (const [verseNum, result] of results) {
        next[verseNum] = result || null
      }

      setData(next)
    })

    return () => {
      cancelled = true
    }
  }, [book, chapter, verses])

  if (!verses.length) return null

  return (
    <div className="interlinear-view">
      {(!strongsDict || !alignmentData) && (
        <div className="interlinear-loading">Loading interlinear data…</div>
      )}

      {strongsDict &&
        alignmentData &&
        verses.map((v) => {
          const result = data[v.verse]
          const alignmentVerseText =
            alignmentData?.books?.[book]?.[String(chapter)]?.[String(v.verse)] || ''

          const englishMap = englishWordsByStrong(alignmentVerseText)

          if (result === undefined) {
            return (
              <div key={v.verse} className="interlinear-verse interlinear-loading">
                {v.book} {v.chapter}:{v.verse} — loading…
              </div>
            )
          }

          if (result === null) {
            return (
              <div key={v.verse} className="interlinear-verse">
                <div className="interlinear-verse-num">
                  {v.book} {v.chapter}:{v.verse}
                </div>

                <div className="interlinear-english-line">
                  {cleanVerseText(v.text)}
                </div>

                <div className="interlinear-note">
                  No original-language interlinear data found for this verse.
                </div>
              </div>
            )
          }

          const language = result.kind === 'hebrew' ? 'hebrew' : 'greek'
          const direction = language === 'hebrew' ? 'rtl' : 'ltr'

          return (
            <div key={v.verse} className="interlinear-verse">
              <div className="interlinear-verse-num">
                {v.book} {v.chapter}:{v.verse}
              </div>

              <div className="interlinear-english-line">
                {cleanVerseText(v.text)}
              </div>

              <div className="interlinear-alignment-note">
                Word labels below are aligned with KJV Strong’s tags.
              </div>

              <div className="interlinear-words-row" dir={direction}>
                {result.words.map((w, i) => (
                  <WordCard
                    key={i}
                    originalWord={w.word}
                    strongsNumbers={w.strongsNumbers || []}
                    parsing={w.parsing}
                    strongsDict={strongsDict}
                    englishWords={matchingEnglishWords(w.strongsNumbers, englishMap)}
                    language={language}
                  />
                ))}
              </div>
            </div>
          )
        })}
    </div>
  )
}


