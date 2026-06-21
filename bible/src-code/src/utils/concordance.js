import { compareByCanonicalOrder } from './bookOrder.js'

// Concordance search: "show me every verse using H1254" (bara/create).
//
// The index is sharded at build time (see scripts/build_concordance.py)
// so looking up one number only fetches the ~1-5MB shard it lives in,
// not the full ~65MB index. The manifest itself is small and cached
// once per session.

const shardModules = import.meta.glob('../data/concordance/*.json')

let manifestPromise = null
function loadManifest() {
  if (!manifestPromise) {
    const importer = shardModules['../data/concordance/manifest.json']
    manifestPromise = importer ? importer().then((m) => m.default) : Promise.resolve({})
  }
  return manifestPromise
}

const shardCache = new Map()
function loadShard(shardName) {
  if (shardCache.has(shardName)) return shardCache.get(shardName)
  const importer = shardModules[`../data/concordance/${shardName}.json`]
  const promise = importer ? importer().then((m) => m.default) : Promise.resolve(null)
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
