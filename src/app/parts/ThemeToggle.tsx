import { useTheme } from '../hooks/useTheme'

/**
 * The light/dark switch.
 *
 * It says which theme it will switch to rather than which one is on, because a
 * button's label should describe what pressing it does.
 */
export function ThemeToggle(): React.JSX.Element {
  const { theme, toggle } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button type="button" className="button button-quiet theme-toggle" onClick={toggle}>
      <span aria-hidden="true" className="theme-mark">{theme === 'dark' ? '◑' : '◐'}</span>
      Switch to {next}
    </button>
  )
}
