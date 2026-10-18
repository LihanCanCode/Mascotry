import { useCallback, useEffect, useState } from 'react'

/**
 * Light or dark, following the operating system until the reader says otherwise.
 *
 * The choice is stored, but a blocked or full storage is not an error worth
 * showing anybody: the toggle still works for the visit, it just will not be
 * remembered next time.
 */
export type Theme = 'light' | 'dark'

const KEY = 'mascotry.theme'
const DARK = '(prefers-color-scheme: dark)'

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function fromSystem(): Theme {
  try {
    return window.matchMedia(DARK).matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Set the stored theme before React mounts, so the first paint is the right one. */
export function applyStoredTheme(): void {
  const choice = stored()
  if (choice !== null) document.documentElement.setAttribute('data-theme', choice)
}

export function useTheme(): { readonly theme: Theme; readonly toggle: () => void } {
  const [choice, setChoice] = useState<Theme | null>(stored)
  const [system, setSystem] = useState<Theme>(fromSystem)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia(DARK)
    const onChange = (): void => setSystem(query.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (choice === null) root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', choice)
  }, [choice])

  const theme = choice ?? system
  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setChoice(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Storage is unavailable; the choice still holds for this visit.
    }
  }, [theme])

  return { theme, toggle }
}
