import { useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    return systemTheme()
  })

  // Apply to DOM
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Follow system changes only when the user has not saved a manual preference
  useEffect(() => {
    if (localStorage.getItem('theme')) return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'light' : 'dark')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function toggle() {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', next)
      return next
    })
  }

  return { theme, toggle }
}
