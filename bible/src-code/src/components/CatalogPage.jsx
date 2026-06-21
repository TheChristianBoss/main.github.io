import React, { useState } from 'react'
import { STATUS } from '../data/catalog.js'

const statusMeta = {
  [STATUS.OPEN]: { label: 'Open', dotClass: 'open' },
  [STATUS.PENDING]: { label: 'Pending review', dotClass: 'pending' },
  [STATUS.RESTRICTED]: { label: 'Restricted', dotClass: 'restricted' },
}

export default function CatalogPage({ translations, onRead, title = 'All translations', description }) {
  const [filter, setFilter] = useState('all')

  const filtered = translations.filter((t) =>
    filter === 'all' ? true : t.status === filter
  )

  const counts = translations.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="reading-ref" style={{ marginBottom: 4 }}>{title}</div>
      <p className="reading-translation-name" style={{ marginBottom: 16 }}>
        {description ?? (
          <>
            {translations.length} translations in the catalog —{' '}
            {counts[STATUS.OPEN] || 0} open and readable,{' '}
            {counts[STATUS.PENDING] || 0} pending license review,{' '}
            {counts[STATUS.RESTRICTED] || 0} restricted.
          </>
        )}
      </p>

      <div className="top-nav">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
        <button className={filter === STATUS.OPEN ? 'active' : ''} onClick={() => setFilter(STATUS.OPEN)}>Open</button>
        <button className={filter === STATUS.PENDING ? 'active' : ''} onClick={() => setFilter(STATUS.PENDING)}>Pending</button>
        <button className={filter === STATUS.RESTRICTED ? 'active' : ''} onClick={() => setFilter(STATUS.RESTRICTED)}>Restricted</button>
      </div>

      <div className="catalog-grid">
        {filtered.map((t) => (
          <div className="catalog-card" key={t.id}>
            <div className="catalog-card-name">{t.name}</div>
            <div className="catalog-card-meta">
              <span className={`status-dot ${statusMeta[t.status].dotClass}`} style={{ marginRight: 6 }} />
              {t.language}{t.year ? ` · ${t.year}` : ''} · {statusMeta[t.status].label}
            </div>
            {t.note && <div className="catalog-card-note">{t.note}</div>}
            {t.status === STATUS.OPEN && (
              <button className="go-btn" style={{ marginTop: 10 }} onClick={() => onRead(t.id)}>
                Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
