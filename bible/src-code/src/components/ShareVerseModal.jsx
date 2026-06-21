import React, { useEffect, useRef, useState } from 'react'

const CANVAS_SIZE = 1080 // square, share-friendly (Instagram/Stories crop fine from square)

const THEMES = {
  parchment: {
    label: 'Parchment',
    bg: ['#080808', '#181818'],
    ink: '#f0ede6',
    accent: '#c9a84c',
    sub: '#8a8070',
  },
  midnight: {
    label: 'Midnight',
    bg: ['#0b1320', '#1a2740'],
    ink: '#eef2fa',
    accent: '#7aa2c4',
    sub: '#9aa7bd',
  },
  sage: {
    label: 'Sage',
    bg: ['#10160f', '#1c2a1a'],
    ink: '#f0f4ec',
    accent: '#8fae78',
    sub: '#a9b59e',
  },
  cream: {
    label: 'Cream',
    bg: ['#f3ecd9', '#e8dec3'],
    ink: '#262017',
    accent: '#9c6b2e',
    sub: '#6b6150',
  },
}

function stripStrongsTags(text) {
  return text ? text.replace(/\{[^}]+\}/g, '') : text
}

/** Greedy word-wrap onto a canvas context, returning the wrapped lines. */
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/)
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

function draw(canvas, { text, reference, translationName, theme }) {
  const ctx = canvas.getContext('2d')
  const size = CANVAS_SIZE
  canvas.width = size
  canvas.height = size

  const t = THEMES[theme] || THEMES.parchment

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, t.bg[0])
  grad.addColorStop(1, t.bg[1])
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // Subtle corner rule, echoing the site's gold-rule aesthetic
  ctx.strokeStyle = t.accent
  ctx.globalAlpha = 0.5
  ctx.lineWidth = 2
  const pad = 64
  ctx.beginPath()
  ctx.moveTo(pad, pad + 24)
  ctx.lineTo(pad, pad)
  ctx.lineTo(pad + 24, pad)
  ctx.moveTo(size - pad - 24, size - pad)
  ctx.lineTo(size - pad, size - pad)
  ctx.lineTo(size - pad, size - pad - 24)
  ctx.stroke()
  ctx.globalAlpha = 1

  const maxWidth = size - pad * 2 - 40

  // Verse text, vertically centered
  const cleanText = stripStrongsTags(text).trim()
  const quoted = `\u201C${cleanText}\u201D`

  let fontSize = cleanText.length > 220 ? 38 : cleanText.length > 120 ? 46 : 56
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = t.ink
  ctx.textAlign = 'center'

  let lines, lineHeight
  do {
    ctx.font = `400 ${fontSize}px Crimson Text, Georgia, serif`
    lineHeight = fontSize * 1.42
    lines = wrapLines(ctx, quoted, maxWidth)
    fontSize -= 2
  } while (lines.length * lineHeight > size * 0.6 && fontSize > 22)

  const blockHeight = lines.length * lineHeight
  const startY = size / 2 - blockHeight / 2 + lineHeight * 0.7

  lines.forEach((line, i) => {
    ctx.fillText(line, size / 2, startY + i * lineHeight)
  })

  // Reference, below the verse
  const refY = startY + lines.length * lineHeight + 46
  ctx.font = `600 30px Cinzel, Georgia, serif`
  ctx.fillStyle = t.accent
  ctx.fillText(reference, size / 2, refY)

  // Translation name + watermark, bottom
  ctx.font = `400 22px Inter, sans-serif`
  ctx.fillStyle = t.sub
  ctx.fillText(translationName || '', size / 2, size - pad - 14)
}

export default function ShareVerseModal({ verse, translationName, onClose }) {
  const canvasRef = useRef(null)
  const [theme, setTheme] = useState('parchment')
  const [busy, setBusy] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    // Make sure the webfonts are actually loaded before the first canvas
    // paint, or the image renders in a fallback font.
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => setFontsReady(true))
    } else {
      setFontsReady(true)
    }
  }, [])

  useEffect(() => {
    if (!fontsReady || !canvasRef.current || !verse) return
    draw(canvasRef.current, {
      text: verse.text,
      reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
      translationName,
      theme,
    })
  }, [fontsReady, verse, translationName, theme])

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
      a.download = `${verse.book}-${verse.chapter}-${verse.verse}.png`
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
      const file = new File([blob], `${verse.book}-${verse.chapter}-${verse.verse}.png`, {
        type: 'image/png',
      })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${verse.book} ${verse.chapter}:${verse.verse}`,
        })
      } else {
        await handleDownload()
      }
    } catch {
      // User cancelled the native share sheet, or share isn't supported --
      // either way, no error state needed here.
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
            Share…
          </button>
        </div>
      </div>
    </div>
  )
}
