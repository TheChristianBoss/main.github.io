// Backs the "red letter" reading feature: a lookup of which verses
// contain the words of Jesus, parsed from a bundled reference list
// (one "Book Chapter:Verse" per line).

import raw from '../data/jesus-verses.txt?raw'

const jesusVerseSet = new Set()

raw.split('\n').forEach((line) => {
  const trimmed = line.trim()
  if (!trimmed) return
  const match = trimmed.match(/^(.+)\s+(\d+):(\d+)$/)
  if (!match) return
  const [, book, chapter, verse] = match
  jesusVerseSet.add(`${book}|${chapter}|${verse}`)
})

export function isJesusVerse(book, chapter, verse) {
  return jesusVerseSet.has(`${book}|${chapter}|${verse}`)
}
