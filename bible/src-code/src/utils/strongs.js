// Parses Strong's-tagged verse text (e.g. "created{H1254}{(H8804)}{H853}")
// into renderable segments, and lazy-loads the Strong's dictionary.

/**
 * Splits a verse string into an ordered array of segments:
 *   { type: 'text', content: string }
 *   { type: 'word', text: string, tags: string[] }
 *
 * Each Strong's tag (e.g. "H1254", "(H8804)") always immediately follows
 * the English word it annotates, with no space in between, and a single
 * word may carry more than one tag (a word number, a grammar/TVM code,
 * an extra untranslated-particle number, etc). All of a word's tags are
 * grouped onto that one 'word' segment so the UI can show them together
 * in a single popup.
 */
export function parseStrongsText(text) {
  if (!text) return []

  // Split on {...}, keeping the bracket contents as captured groups.
  // Even indices = plain text runs; odd indices = tag contents (no braces).
  const parts = text.split(/\{([^}]+)\}/g)
  const segments = []
  let pendingWord = null // { text: string, tags: string[] }

  const flush = () => {
    if (pendingWord) {
      segments.push({ type: 'word', text: pendingWord.text, tags: pendingWord.tags })
      pendingWord = null
    }
  }

  for (let i = 0; i < parts.length; i++) {
    const isTag = i % 2 === 1
    const part = parts[i]

    if (!isTag) {
      if (part === '') continue // empty gap between back-to-back tags

      const followedByTag = i + 1 < parts.length
      if (followedByTag) {
        // The tag(s) coming next attach to the last whitespace-delimited
        // word in this chunk; everything before that word is plain text.
        const m = part.match(/(\S+)$/)
        if (m) {
          flush()
          const prefix = part.slice(0, m.index)
          if (prefix) segments.push({ type: 'text', content: prefix })
          pendingWord = { text: m[0], tags: [] }
        } else {
          flush()
          segments.push({ type: 'text', content: part })
        }
      } else {
        flush()
        segments.push({ type: 'text', content: part })
      }
    } else {
      if (!pendingWord) pendingWord = { text: '', tags: [] }
      pendingWord.tags.push(part)
    }
  }
  flush()

  return segments
}

/**
 * Strips the optional parens from a tag and normalizes zero-padding, e.g.
 * "(H8804)" -> "H8804", "G0011" -> "G11". Some translation files
 * (e.g. rv1909-strongs) zero-pad numbers to 4 digits; the dictionary keys
 * do not.
 */
export function tagNumber(tag) {
  const raw = tag.replace(/[()]/g, '')
  const m = raw.match(/^([HG])0*(\d+)$/)
  return m ? m[1] + m[2] : raw
}

export function isGrammarTag(tag) {
  return tag.startsWith('(')
}

// Lazy-load the ~3.7MB Strong's dictionary only when a translation that
// actually has Strong's tags is opened, and cache it across the session.
let strongsPromise = null
export function loadStrongsDictionary() {
  if (!strongsPromise) {
    strongsPromise = import('../data/strongs.json').then((m) => m.default)
  }
  return strongsPromise
}
