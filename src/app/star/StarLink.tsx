import { STAR_URL } from './starAsk'
import { StarGlyph } from './StarGlyph'

/**
 * The quiet option: always in the masthead, never counted as the ask.
 *
 * A plain link. No widget, no star count, nothing fetched — the page keeps its
 * promise that it talks to no other origin, and this is only a door out.
 */
export function StarLink(): React.JSX.Element {
  return (
    <a
      className="button button-quiet star-link"
      href={STAR_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <StarGlyph />
      Star on GitHub
    </a>
  )
}
