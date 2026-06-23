import React, { useEffect, useState } from 'react'

export default function SharedNav() {
  const [html, setHtml] = useState('')

  useEffect(() => {
    let active = true

    fetch('/components/navbar-main.html', { cache: 'no-cache' })
      .then((res) => (res.ok ? res.text() : ''))
      .then((text) => {
        if (!active) return
        setHtml(text.replace(/\s+onclick="[^"]*"/g, ''))
      })
      .catch(() => {
        if (active) setHtml('')
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const host = document.querySelector('.cg-nav-host')
    const button = host?.querySelector('.cg-nav__toggle')
    const links = host?.querySelector('.cg-nav__links')

    if (!button || !links) return

    const toggle = () => links.classList.toggle('open')
    button.addEventListener('click', toggle)

    return () => button.removeEventListener('click', toggle)
  }, [html])

  if (!html) return null

  return <div className="cg-nav-host" dangerouslySetInnerHTML={{ __html: html }} />
}
