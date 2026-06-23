const fs = require('fs')
const path = require('path')

const root = process.cwd()

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function write(rel, text) {
  fs.writeFileSync(path.join(root, rel), text, 'utf8')
  console.log('updated', rel)
}

function copyFromPatch(name, dest) {
  const src = path.join(root, name)
  if (!fs.existsSync(src)) throw new Error(`Missing patch file: ${name}`)
  fs.copyFileSync(src, path.join(root, dest))
  console.log('replaced', dest)
}

copyFromPatch('BookmarksPanel.jsx', 'src/components/BookmarksPanel.jsx')
copyFromPatch('ShareVerseModal.jsx', 'src/components/ShareVerseModal.jsx')

let app = read('src/App.jsx')

if (!app.includes('const handleSavePassageBookmark = useCallback')) {
  const insert = `

  const handleSavePassageBookmark = useCallback(
    ({ translation, verses, scope }) => {
      if (!translation || !Array.isArray(verses) || verses.length === 0) return

      const cleanVerses = verses.map((v) => ({
        book: v.book,
        chapter: Number(v.chapter),
        verse: Number(v.verse),
        text: v.text,
      }))

      const first = cleanVerses[0]
      const last = cleanVerses[cleanVerses.length - 1]
      const range = first.verse === last.verse ? String(first.verse) : \`\${first.verse}-\${last.verse}\`
      const key = \`passage:\${translation.id}:\${first.book}:\${first.chapter}:\${range}\`

      setBookmarks((prev) => {
        const nextBookmark = {
          key,
          type: 'passage',
          scope: scope || 'shown',
          translationId: translation.id,
          translationName: translation.name,
          hasStrongs: !!translation.hasStrongs,
          book: first.book,
          chapter: first.chapter,
          verse: first.verse,
          verseStart: first.verse,
          verseEnd: last.verse,
          text: cleanVerses.map((v) => \`\${v.verse}. \${v.text}\`).join('\\n'),
          verses: cleanVerses,
          addedAt: Date.now(),
        }

        if (prev.some((b) => b.key === key)) {
          return prev.map((b) =>
            b.key === key ? { ...nextBookmark, addedAt: b.addedAt } : b
          )
        }

        return [...prev, nextBookmark]
      })
    },
    [setBookmarks]
  )
`
  app = app.replace(/\n\s*const handleRemoveBookmark = useCallback\(/, `${insert}\n  const handleRemoveBookmark = useCallback(`)
}

if (!app.includes('hasStrongs: !!translation.hasStrongs')) {
  app = app.replace(
    /translationName: translation\.name,\s*\n\s*book: v\.book,/,
    "translationName: translation.name,\n            hasStrongs: !!translation.hasStrongs,\n            book: v.book,"
  )
}

app = app.replace(
  /setChapter\(Number\(b\.chapter\)\)\s*\n\s*setVerseRangeInput\(String\(b\.verse\)\)/,
  "setChapter(Number(b.chapter))\n    const start = b.verseStart ?? b.verse\n    const end = b.verseEnd\n    setVerseRangeInput(end && Number(end) !== Number(start) ? `${start}-${end}` : String(start))"
)

if (!app.includes('highlights={highlights}')) {
  app = app.replace(
    /<BookmarksPanel\s*\n\s*bookmarks=\{bookmarks\}/,
    "<BookmarksPanel\n            bookmarks={bookmarks}\n            highlights={highlights}"
  )
}

if (!app.includes('onSavePassageBookmark={handleSavePassageBookmark}')) {
  app = app.replace(
    /onToggleBookmark=\{handleToggleBookmark\}\s*\n\s*onSetHighlight=\{handleSetHighlight\}/,
    "onToggleBookmark={handleToggleBookmark}\n                onSavePassageBookmark={handleSavePassageBookmark}\n                onSetHighlight={handleSetHighlight}"
  )
}

write('src/App.jsx', app)

let pane = read('src/components/ReadingPane.jsx')

if (!pane.includes('onSavePassageBookmark,')) {
  pane = pane.replace(
    /onToggleBookmark,\s*\n\s*onSetHighlight,/,
    "onToggleBookmark,\n  onSavePassageBookmark,\n  onSetHighlight,"
  )
}

if (!pane.includes("Bookmark shown verses")) {
  const marker = `          <button
            type="button"
            className={\`top-nav-toggle \${interlinearOpen ? 'active' : ''}\`}
            onClick={() => setInterlinearOpen((v) => !v)}
          >
            {interlinearOpen ? 'Hide interlinear' : 'Interlinear'}
          </button>`

  const add = `${marker}
          {onSavePassageBookmark && stamped.length > 0 && (
            <button
              type="button"
              className="top-nav-toggle"
              onClick={() => onSavePassageBookmark({ translation, verses: stamped, scope: 'shown' })}
            >
              Bookmark shown verses
            </button>
          )}
          {onSavePassageBookmark && fullChapterVerses.length > 0 && (
            <button
              type="button"
              className="top-nav-toggle"
              onClick={() => onSavePassageBookmark({ translation, verses: fullChapterVerses, scope: 'chapter' })}
            >
              Bookmark full chapter
            </button>
          )}`

  pane = pane.replace(marker, add)
}

if (!pane.includes('translationId={translation.id}')) {
  pane = pane.replace(
    /translationName=\{translation\.name\}\s*\n\s*onClose=\{\(\) => setShareVerse\(null\)\}/,
    "translationName={translation.name}\n          translationId={translation.id}\n          highlights={highlights}\n          onClose={() => setShareVerse(null)}"
  )
}

write('src/components/ReadingPane.jsx', pane)

let styles = read('src/styles.css')
const css = fs.readFileSync(path.join(root, 'passage-bookmarks.css'), 'utf8')
if (!styles.includes('bookmark-passage-verse')) {
  styles += '\n' + css + '\n'
  write('src/styles.css', styles)
} else {
  console.log('styles already include passage bookmark CSS')
}

console.log('Done. Run npm run build next.')
