import { compareByCanonicalOrder } from './bookOrder.js'

// Concordance search: "show me every verse using H1254" (bara/create).
//
// The concordance index lives in public/concordance during development and
// is deployed to /bible/concordance/ in production. Fetching the shard files
// instead of bundling them keeps the main app bundle small and avoids Vite
// dropping the import glob when the data is not inside src/data.

const BASE_URL = (import.meta.env?.BASE_URL || '/bible/').replace(/\/?$/, '/')
const CONCORDANCE_BASE = `${BASE_URL}concordance/`

async function fetchJson(path, fallback) {
  try {
    const response = await fetch(path)
    if (!response.ok) return fallback
    return await response.json()
  } catch {
    return fallback
  }
}

let manifestPromise = null
function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetchJson(`${CONCORDANCE_BASE}manifest.json`, {})
  }
  return manifestPromise
}

const shardCache = new Map()
function loadShard(shardName) {
  if (!shardName) return Promise.resolve(null)
  if (shardCache.has(shardName)) return shardCache.get(shardName)

  // Manifest values are expected to look like "G0-G499" or "H1000-H1499".
  // Keep the filename restricted so user input can never shape an arbitrary URL.
  const safeShardName = String(shardName).replace(/[^HG0-9-]/g, '')
  const promise = fetchJson(`${CONCORDANCE_BASE}${safeShardName}.json`, null)
  shardCache.set(shardName, promise)
  return promise
}

/**
 * Normalizes user input like "h1254", "H 1254", "(H8804)" into "H1254".
 */
export function normalizeStrongsNumber(input) {
  if (!input) return null
  const raw = input.trim().toUpperCase().replace(/[()\s]/g, '')
  const m = raw.match(/^([HG])0*(\d+)$/)
  return m ? m[1] + m[2] : null
}

/**
 * Looks up every occurrence of a Strong's number across every indexed
 * translation. Returns { translationId -> [{book, chapter, verse}] },
 * or null if the number isn't in the index at all.
 */
export async function lookupConcordance(number) {
  const num = normalizeStrongsNumber(number)
  if (!num) return null
  const manifest = await loadManifest()
  const shardName = manifest[num]
  if (!shardName) return null
  const shard = await loadShard(shardName)
  return shard ? shard[num] || null : null
}

/**
 * Flattens a lookupConcordance() result into a single sorted list of
 * { translationId, book, chapter, verse } entries, deduped by
 * book/chapter/verse so the same underlying verse showing up in two
 * Strong's-tagged translations (e.g. kjv-strongs and asv-strongs) is
 * still one row in the UI, with a note on which translations tag it.
 */
export function flattenConcordanceResult(result) {
  if (!result) return []
  const byVerse = new Map() // "book|chapter|verse" -> { book, chapter, verse, translationIds: Set }
  for (const [translationId, refs] of Object.entries(result)) {
    for (const ref of refs) {
      const key = `${ref.book}|${ref.chapter}|${ref.verse}`
      if (!byVerse.has(key)) {
        byVerse.set(key, { book: ref.book, chapter: ref.chapter, verse: ref.verse, translationIds: new Set() })
      }
      byVerse.get(key).translationIds.add(translationId)
    }
  }
  const list = Array.from(byVerse.values()).map((v) => ({
    ...v,
    translationIds: Array.from(v.translationIds),
  }))
  // Sort Genesis -> Revelation, the order a reader actually expects.
  list.sort(compareByCanonicalOrder)
  return list
}
