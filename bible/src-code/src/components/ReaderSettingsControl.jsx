import React from 'react'

const MIN_SIZE = 14
const MAX_SIZE = 28
const DEFAULT_RED = '#D94F4F'

export default function ReaderSettingsControl({ settings, onChange }) {
  const { fontSize, redLetterEnabled, redLetterColor } = settings

  const adjust = (delta) => {
    const next = Math.min(MAX_SIZE, Math.max(MIN_SIZE, fontSize + delta))
    onChange({ ...settings, fontSize: next })
  }

  return (
    <div className="sidebar-section">
      <span className="sidebar-label">Reading settings</span>

      <div className="font-size-row">
        <button type="button" className="font-size-btn" onClick={() => adjust(-1)} aria-label="Decrease font size">
          A−
        </button>
        <span className="font-size-value">{fontSize}px</span>
        <button type="button" className="font-size-btn" onClick={() => adjust(1)} aria-label="Increase font size">
          A+
        </button>
      </div>

      <label className="red-letter-row">
        <input
          type="checkbox"
          checked={redLetterEnabled}
          onChange={(e) => onChange({ ...settings, redLetterEnabled: e.target.checked })}
        />
        <span>Red letter (words of Jesus)</span>
      </label>

      {redLetterEnabled && (
        <div className="red-letter-color-row">
          <input
            type="color"
            value={redLetterColor}
            onChange={(e) => onChange({ ...settings, redLetterColor: e.target.value })}
            aria-label="Red letter color"
          />
          {redLetterColor.toLowerCase() !== DEFAULT_RED.toLowerCase() && (
            <button
              type="button"
              className="reset-color-btn"
              onClick={() => onChange({ ...settings, redLetterColor: DEFAULT_RED })}
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export { DEFAULT_RED }
