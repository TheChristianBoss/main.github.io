// Small localStorage-backed persistence helper used by bookmarks,
// highlights, reading history, and reader settings. All Open Bible
// Library data lives client-side only — nothing is sent anywhere.

import { useState, useEffect } from 'react'

const PREFIX = 'obl:'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // localStorage may be unavailable (private browsing, quota, etc).
    // Fail silently — the feature just won't persist this session.
  }
}

/** A useState whose value is persisted to localStorage under a namespaced key. */
export function usePersistentState(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback))

  useEffect(() => {
    write(key, value)
  }, [key, value])

  return [value, setValue]
}
