import React from 'react'
import { STATUS } from '../data/catalog.js'

const statusClass = {
  [STATUS.OPEN]: 'open',
  [STATUS.PENDING]: 'pending',
  [STATUS.RESTRICTED]: 'restricted',
}

export default function TranslationSwitcher({ translations, activeId, onSelect }) {
  return (
    <div className="translation-switcher" role="listbox" aria-label="Choose a translation">
      {translations.map((t) => (
        <button
          key={t.id}
          role="option"
          aria-selected={t.id === activeId}
          className={`translation-tab ${t.id === activeId ? 'active' : ''}`}
          onClick={() => onSelect(t.id)}
          title={t.name}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <span className={`status-dot ${statusClass[t.status]}`} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.name}
            </span>
          </span>
          <span className="lang-tag">{t.language}</span>
        </button>
      ))}
    </div>
  )
}
