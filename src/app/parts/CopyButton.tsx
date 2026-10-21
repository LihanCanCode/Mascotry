import { useEffect } from 'react'
import { useClipboard } from '../hooks/useClipboard'

interface CopyButtonProps {
  readonly text: string
  readonly what: string
  /** Called once the text is really on the clipboard, never when it is refused. */
  readonly onCopied?: () => void
}

const WORDING: Readonly<Record<string, string>> = {
  idle: 'Copy',
  copied: 'Copied',
  failed: 'Copy blocked',
}

/**
 * Copy, and say what happened.
 *
 * The result is announced rather than only coloured, because a clipboard write
 * can be refused — outside a secure context, or with the permission denied —
 * and a button that looks like it worked is the worst of the three outcomes.
 */
export function CopyButton({ text, what, onCopied }: CopyButtonProps): React.JSX.Element {
  const { state, copy } = useClipboard()

  useEffect(() => {
    if (state === 'copied') onCopied?.()
  }, [state, onCopied])

  return (
    <span className="copy">
      <button
        type="button"
        className="button button-quiet"
        onClick={() => {
          void copy(text)
        }}
      >
        {WORDING[state]} <span className="visually-hidden">{what}</span>
      </button>
      <span role="status" aria-live="polite" className={`copy-said copy-${state}`}>
        {state === 'copied' ? `${what} copied to the clipboard.` : null}
        {state === 'failed' ? 'The browser would not let the page use the clipboard. Select the text instead.' : null}
      </span>
    </span>
  )
}
