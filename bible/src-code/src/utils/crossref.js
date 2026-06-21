const BASE = import.meta.env.BASE_URL

const bookCache = new Map()
function loadBookShard(book) {
  const fname = book.replace(/ /g, '_')
  if (bookCache.has(fname)) return bookCache.get(fname)
 
 const promise = fetch(`${BASE}crossrefs/${fname}.json`).then(r => r.json()).catch(() => null)
  bookCache.set(fname, promise)
  return promise
}

export async function lookupCrossReferences(book, chapter, verse) {
  const shard = await loadBookShard(book)
  if (!shard) return []
  return shard[`${chapter}:${verse}`] || []
}

export function formatCrossRef(ref) {
  let str = `${ref.book} ${ref.chapter}:${ref.verse}`
  if (ref.endChapter != null) {
    str += ref.endChapter === ref.chapter ? `-${ref.endVerse}` : `-${ref.endChapter}:${ref.endVerse}`
  }
  return 















str

}

