import { STAR_URL, type StarStorage } from './starAsk'
import { StarGlyph } from './StarGlyph'
import { useStarAsk } from './useStarAsk'

interface StarPromptProps {
  /** True once the export is actually ready: the files exist and can be taken. */
  readonly ready: boolean
  /** Injected in tests; left out in the app, which uses `localStorage`. */
  readonly storage?: StarStorage | null
}

/**
 * The ask, shown once, after the files are ready.
 *
 * It is a card in the normal flow rather than a modal: nothing is covered,
 * nothing is dimmed, and the page carries on working whether it is read or
 * not. Both answers — the link and the dismissal — are final.
 */
export function StarPrompt({ ready, storage }: StarPromptProps): React.JSX.Element | null {
  const { open, dismiss, follow } = useStarAsk(ready, storage)
  if (!open) return null

  return (
    <aside className="star-ask" aria-label="A word from the author">
      <p className="star-ask-words">
        Mascotry is one person&rsquo;s side project. If it was useful, a star on GitHub is a kind way to say so.
      </p>
      <p className="star-ask-actions">
        <a
          className="button star-ask-go"
          href={STAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={follow}
        >
          <StarGlyph />
          Star Mascotry on GitHub
        </a>
        <button
          type="button"
          className="button button-quiet"
          aria-label="No thanks, do not ask again"
          onClick={dismiss}
        >
          No thanks
        </button>
      </p>
    </aside>
  )
}
