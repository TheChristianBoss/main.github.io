import React, { useState, useCallback } from 'react'
import {
  lookupConcordance,
  flattenConcordanceResult,
  normalizeStrongsNumber,
} from '../utils/concordance.js'

const EXAMPLES = ['H1254', 'H7225', 'G26', 'G2316', 'G3056']

export default function ConcordancePage({ translations, onPick }) {
  const [input, setInput] = useState('')
  const [number, setNumber] = useState(null)
  const [results, setResults] = useState(null) // null = not searched yet
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const translationName = useCallback(
    (id) => translations.find((t) => t.id === id)?.name || id,
    [translations]
  )

  const runSearch = useCallback(async (raw) => {
    const num = normalizeStrongsNumber(raw)
    if (!num) {
      setResults(null)
      setNotFound(true)
      return
    }
    setLoading(true)
    setNotFound(false)
    setNumber(num)
    const result = await lookupConcordance(num)
    setResults(flattenConcordanceResult(result))
    setNotFound(!result)
    setLoading(false)
  }, [])

  return (
    <div className="concordance-page">
      <div className="reading-ref" style={{ marginBottom: 4 }}>Concordance</div>
      <p className="reading-translation-name" style={{ marginBottom: 16 }}>
        Look up every verse that uses a given Strong's number — e.g.{' '}
        <code>H1254</code> (bara / "create") or <code>G26</code> (agape /
        "love"). Searches across every Strong's-tagged translation in the
        library.
      </p>

      <div className="ref-row" style={{ maxWidth: 360 }}>
        <input
          className="ref-input"
          placeholder="e.g. H1254 or G26"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch(input)}
        />
        <button className="go-btn" onClick={() => runSearch(input)}>
          Search
        </button>
      </div>

      <div className="concordance-examples">
        Try:{' '}
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="concordance-example-chip"
            onClick={() => {
              setInput(ex)
              runSearch(ex)
            }}
          >
            {ex}
          </button>
        ))}
      </div>

      {loading && <div className="empty-state">Searching…</div>}

      {!loading && notFound && (
        <div className="empty-state">
          No entries found for that number. Strong's numbers look like
          "H1254" (Hebrew) or "G26" (Greek).
        </div>
      )}

      {!loading && results && results.length > 0 && (
        <>
          <div className="concordance-count">
            {results.length} verse{results.length === 1 ? '' : 's'} found for{' '}
            <strong>{number}</strong>
          </div>
          <div className="search-results">
            {results.map((r, i) => (
              <div
                key={i}
                className="search-result-item"
                onClick={() => onPick(r)}
              >
                <div className="search-result-ref">
                  {r.book} {r.chapter}:{r.verse}
                </div>
                <div className="search-result-text concordance-translations">
                  {r.translationIds.map(translationName).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
