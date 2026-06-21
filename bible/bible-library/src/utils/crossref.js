// Cross-references ("Treasury of Scripture Knowledge"-style related
// passages), sourced from openbible.info's public-domain/CC-BY dataset
// and pre-sharded per book at build time (see scripts/build_crossrefs.py)
// so opening a verse only fetches that one book's file (a few hundred KB
// to ~2MB for Psalms), not the full ~20MB dataset.

const shardModules = import.meta.glob('../data/crossrefs/*.json')

const bookCache = new Map()
function loadBookShard(book) {
  const fname = book.replace(/ /g, '_')
  if (bookCache.has(fname)) return bookCache.get(fname)
  const importer = shardModules[`../data/crossrefs/${fname}.json`]
  const promise = importer ? importer().then((m) => m.default) : Promise.resolve(null)
  bookCache.set(fname, promise)
  return promise
}

/**
 * Returns the list of cross-referenced passages for a single verse,
 * sorted by relevance (votes, descending -- already sorted at build
 * time). Each entry is { book, chapter, verse, votes, endChapter?,
 * endVerse? } -- endChapter/endVerse are present when the reference is a
 * range (e.g. Proverbs 8:22-30).
 */
export async function lookupCrossReferences(book, chapter, verse) {
  const shard = await loadBookShard(book)
  if (!shard) return []
  return shard[`${chapter}:${verse}`] || []
}

/** Formats a cross-ref entry as a human-readable reference string, e.g.
 * "Proverbs 8:22-30" or "John 1:1". */
export function formatCrossRef(ref) {
  let str = `${ref.book} ${ref.chapter}:${ref.verse}`
  if (ref.endChapter != null) {
    str += ref.endChapter === ref.chapter ? `-${ref.endVerse}` : `-${ref.endChapter}:${ref.endVerse}`
  }
  return str
}
