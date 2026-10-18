/**
 * Light and dark for the demo page, without React.
 *
 * Same rule as the app: follow the operating system until the reader picks,
 * then remember the pick. A blocked storage costs the memory, not the toggle.
 */
type Theme = 'light' | 'dark'

const KEY = 'mossgate.theme'
const DARK = '(prefers-color-scheme: dark)'

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function active(): Theme {
  const choice = stored()
  if (choice !== null) return choice
  try {
    return window.matchMedia(DARK).matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyStoredTheme(): void {
  const choice = stored()
  if (choice !== null) document.documentElement.setAttribute('data-theme', choice)
}

function wording(button: HTMLButtonElement): void {
  button.textContent = active() === 'dark' ? 'Switch to light' : 'Switch to dark'
}

export function watchTheme(button: HTMLButtonElement): void {
  wording(button)
  button.addEventListener('click', () => {
    const next: Theme = active() === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Not remembered for next time; still applied for this visit.
    }
    wording(button)
  })
}
