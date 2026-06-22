import React, { useEffect, useMemo, useRef, useState } from 'react'
import { isGrammarTag, parseStrongsText, tagNumber } from '../utils/strongs.js'

const WIDTH = 1080

const THEMES = {
  parchment: {
    label: 'Parchment',
    bg: ['#080808', '#181818'],
    ink: '#f0ede6',
    accent: '#c9a84c',
    sub: '#8a8070',
    panel: 'rgba(255,255,255,0.045)',
  },
  midnight: {
    label: 'Midnight',
    bg: ['#0b1320', '#1a2740'],
    ink: '#eef2fa',
    accent: '#7aa2c4',
    sub: '#9aa7bd',
    panel: 'rgba(255,255,255,0.05)',
  },
  sage: {
    label: 'Sage',
    bg: ['#10160f', '#1c2a1a'],
    ink: '#f0f4ec',
    accent: '#8fae78',
    sub: '#a9b59e',
    panel: 'rgba(255,255,255,0.05)',
  },
  cream: {
    label: 'Cream',
    bg: ['#f3ecd9', '#e8dec3'],
    ink: '#262017',
    accent: '#9c6b2e',
    sub: '#6b6150',
    panel: 'rgba(0,0,0,0.035)',
  },
}

function hasStrongsTags(text) {
  return /\{[HG]\d+\}/.test(String(text || ''))
}

function stripTags(text) {
  return String(text || '').replace(/\{[^}]+\}/g, '')
}

function unique(items) {
  return [...new Set(items.filter(Boolean))]
}

function cleanText(text, includeStrongs) {
  if (!includeStrongs) return stripTags(text).replace(/\s+/g, ' ').trim()

  return parseStrongsText(text)
    .map((seg) => {
      if (seg.type === 'text') return seg.content

      const nums = unique(
        seg.tags
          .filter((tag) => !isGrammarTag(tag))
          .map(tagNumber)
          .filter((num) => /^[HG]\d+$/.test(num))
      )

      return nums.length ? `${seg.text} (${nums.join(', ')})` : seg.text
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

function rangeLabel(verses) {
  if (!verses?.length) return ''
  const first = verses[0]
  const last = verses[verses.length - 1]

  if (verses.length === 1 || first.verse === last.verse) {
    return `${first.book} ${first.chapter}:${first.verse}`
  }

  return `${first.book} ${first.chapter}:${first.verse}-${last.verse}`
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''

  for (const word of words) {
    const trial = line ? `${line} ${word}` : word

    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = trial
    }
  }

  if (line) lines.push(line)
  return lines
}

function background(ctx, width, height, theme) {
  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, theme.bg[0])
  grad.addColorStop(1, theme.bg[1])
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)
}

function drawQuote(canvas, { verse, reference, translationName, theme, includeStrongs }) {
  const width = WIDTH
  const height = WIDTH
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  background(ctx, width, height, theme)

  const text = `"${cleanText(verse.text, includeStrongs)}"`
  const maxWidth = width - 150

  let fontSize =
    text.length > 420 ? 26 :
    text.length > 300 ? 30 :
    text.length > 220 ? 38 :
    text.length > 120 ? 46 :
    56

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = theme.ink

  let lines
  let lineHeight

  do {
    ctx.font = `400 ${fontSize}px Crimson Text, Georgia, serif`
    lineHeight = fontSize * 1.42
    lines = wrapLines(ctx, text, maxWidth)
    fontSize -= 2
  } while (lines.length * lineHeight > height * 0.62 && fontSize > 18)

  const startY = height / 2 - (lines.length * lineHeight) / 2 + lineHeight

  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeight)
  })

  ctx.font = '600 30px Cinzel, Georgia, serif'
  ctx.fillStyle = theme.accent
  ctx.fillText(reference, width / 2, startY + lines.length * lineHeight + 46)

  ctx.font = '400 22px Inter, sans-serif'
  ctx.fillStyle = theme.sub
  ctx.fillText(translationName || '', width / 2, height - 76)
}

function drawPassage(canvas, { verses, reference, translationName, theme, includeStrongs }) {
  const width = WIDTH
  const pad = 70
  const maxTextWidth = width - 210
  const totalChars = verses.reduce((sum, v) => sum + String(v.text || '').length, 0)

  const fontSize =
    totalChars > 6500 ? 17 :
    totalChars > 4500 ? 19 :
    totalChars > 2800 ? 22 :
    totalChars > 1500 ? 26 :
    31

  const lineHeight = fontSize * 1.38

  canvas.width = width
  canvas.height = 10

  let ctx = canvas.getContext('2d')
  ctx.font = `400 ${fontSize}px Crimson Text, Georgia, serif`

  const measured = verses.map((v) => ({
    verse: v.verse,
    lines: wrapLines(ctx, cleanText(v.text, includeStrongs), maxTextWidth),
  }))

  const textHeight = measured.reduce(
    (sum, item) => sum + item.lines.length * lineHeight + fontSize * 0.75,
    0
  )

  const height = Math.max(1080, Math.ceil(260 + textHeight + 90))

  canvas.width = width
  canvas.height = height
  ctx = canvas.getContext('2d')

  background(ctx, width, height, theme)

  ctx.textAlign = 'center'
  ctx.font = '600 38px Cinzel, Georgia, serif'
  ctx.fillStyle = theme.accent
  ctx.fillText(reference, width / 2, 115)

  ctx.font = '400 20px Inter, sans-serif'
  ctx.fillStyle = theme.sub
  ctx.fillText(translationName || '', width / 2, 150)

  ctx.fillStyle = theme.panel
  ctx.fillRect(pad - 22, 185, width - pad * 2 + 44, height - 250)

  let y = 235

  measured.forEach((item) => {
    ctx.textAlign = 'right'
    ctx.font = `700 ${Math.max(14, fontSize - 5)}px Inter, sans-serif`
    ctx.fillStyle = theme.accent
    ctx.fillText(String(item.verse), pad + 32, y)

    ctx.textAlign = 'left'
    ctx.font = `400 ${fontSize}px Crimson Text, Georgia, serif`
    ctx.fillStyle = theme.ink

    item.lines.forEach((line, i) => {
      ctx.fillText(line, pad + 60, y + i * lineHeight)
    })

    y += item.lines.length * lineHeight + fontSize * 0.75
  })
}

export default function ShareVerseModal({
  verse,
  shownVerses = [],
  chapterVerses = [],
  translationName,
  onClose,
}) {
  const canvasRef = useRef(null)
  const [theme, setTheme] = useState('parchment')
  const [busy, setBusy] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const [includeStrongs, setIncludeStrongs] = useState(false)
  const [scope, setScope] = useState('verse')

  const verseHasStrongs =
    hasStrongsTags(verse?.text) ||
    shownVerses.some((v) => hasStrongsTags(v.text)) ||
    chapterVerses.some((v) => hasStrongsTags(v.text))

  const selectedVerses = useMemo(() => {
    if (scope === 'shown') return shownVerses.length ? shownVerses : [verse]
    if (scope === 'chapter') return chapterVerses.length ? chapterVerses : shownVerses.length ? shownVerses : [verse]
    return [verse]
  }, [scope, shownVerses, chapterVerses, verse])

  const reference = rangeLabel(selectedVerses)

  useEffect(() => {
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => setFontsReady(true))
    } else {
      setFontsReady(true)
    }
  }, [])

  useEffect(() => {
    if (!fontsReady || !canvasRef.current || !verse) return

    const t = THEMES[theme] || THEMES.parchment
    const shouldIncludeStrongs = verseHasStrongs && includeStrongs

    if (scope === 'verse') {
      drawQuote(canvasRef.current, {
        verse,
        reference,
        translationName,
        theme: t,
        includeStrongs: shouldIncludeStrongs,
      })
    } else {
      drawPassage(canvasRef.current, {
        verses: selectedVerses,
        reference,
        translationName,
        theme: t,
        includeStrongs: shouldIncludeStrongs,
      })
    }
  }, [fontsReady, verse, selectedVerses, reference, translationName, theme, includeStrongs, verseHasStrongs, scope])

  if (!verse) return null

  const getBlob = () =>
    new Promise((resolve) => canvasRef.current.toBlob(resolve, 'image/png'))

  const handleDownload = async () => {
    setBusy(true)
    try {
      const blob = await getBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reference.replace(/[:\s]/g, '-')}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }

  const handleShare = async () => {
    setBusy(true)
    try {
      const blob = await getBlob()
      const file = new File([blob], `${reference.replace(/[:\s]/g, '-')}.png`, {
        type: 'image/png',
      })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: reference })
      } else {
        await handleDownload()
      }
    } catch {
      // user cancelled or sharing unsupported
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="share-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="share-modal" role="dialog" aria-label="Share verse as image">
        <button className="strongs-popup-close" onClick={onClose} aria-label="Close">×</button>

        <div className="share-modal-preview">
          <canvas ref={canvasRef} className="share-modal-canvas" />
        </div>

        <div className="share-scope-row">
          <button type="button" className={`share-scope-btn ${scope === 'verse' ? 'active' : ''}`} onClick={() => setScope('verse')}>
            This verse
          </button>
          <button type="button" className={`share-scope-btn ${scope === 'shown' ? 'active' : ''}`} onClick={() => setScope('shown')}>
            Shown verses
          </button>
          <button type="button" className={`share-scope-btn ${scope === 'chapter' ? 'active' : ''}`} onClick={() => setScope('chapter')}>
            Full chapter
          </button>
        </div>

        {verseHasStrongs && (
          <label className="share-strongs-toggle">
            <input
              type="checkbox"
              checked={includeStrongs}
              onChange={(e) => setIncludeStrongs(e.target.checked)}
            />
            Include Strong's numbers
          </label>
        )}

        <div className="share-theme-row">
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              className={`share-theme-swatch ${theme === key ? 'active' : ''}`}
              style={{ background: `linear-gradient(135deg, ${t.bg[0]}, ${t.bg[1]})` }}
              title={t.label}
              onClick={() => setTheme(key)}
            />
          ))}
        </div>

        <div className="share-modal-actions">
          <button type="button" className="go-btn" onClick={handleDownload} disabled={busy}>
            Download
          </button>
          <button type="button" className="go-btn" onClick={handleShare} disabled={busy}>
            Share...
          </button>
        </div>
      </div>
    </div>
  )
}
