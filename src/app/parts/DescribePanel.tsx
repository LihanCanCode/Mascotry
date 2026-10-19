import { useCallback, useEffect, useState } from 'react'
import { EXAMPLE_DESCRIPTIONS, MAX_CHARS, PHRASE_COUNT, drawExample } from '../../describe'
import type { DescribeNote } from '../state/reducer'

/** Long enough that a word being typed is not parsed six times, short enough to feel live. */
const SETTLE = 180

interface DescribePanelProps {
  readonly text: string
  readonly note: DescribeNote | null
  readonly onDescribe: (text: string) => void
}

/** The quiet line under the box: what was read, and what was not. */
function Account({ note }: { readonly note: DescribeNote | null }): React.JSX.Element {
  if (note === null) {
    return <p className="account">Nothing read yet. Type anything — colours, hair, glasses, a hat, an animal.</p>
  }
  const read = note.matched.length === 0 ? 'Nothing recognised in that yet.' : `Read: ${note.matched.join(', ')}.`
  const skipped = note.ignored.length === 0 ? '' : ` Skipped: ${note.ignored.join(', ')}.`
  return (
    <p className="account">
      {read}
      {skipped}
      {note.ignored.length === 0 ? '' : ' Those words have no part to change, so nothing was invented for them.'}
    </p>
  )
}

/**
 * Words to a character.
 *
 * The input is local and the parse is debounced, so every keystroke is shown
 * immediately in the box and the eighteen poses are only redrawn once the
 * typing settles. "Surprise me" draws from a bag rather than picking at random,
 * which is why pressing it twice never shows the same description twice.
 */
export function DescribePanel({ text, note, onDescribe }: DescribePanelProps): React.JSX.Element {
  const [value, setValue] = useState(text)
  const [bag, setBag] = useState<readonly string[]>(EXAMPLE_DESCRIPTIONS)

  useEffect(() => {
    if (value === text) return undefined
    const timer = setTimeout(() => onDescribe(value), SETTLE)
    return () => clearTimeout(timer)
  }, [value, text, onDescribe])

  const surprise = useCallback(() => {
    const drawn = drawExample(bag)
    setBag(drawn.rest)
    setValue(drawn.text)
  }, [bag])

  return (
    <div className="describe">
      <p className="field">
        <label className="field-label" htmlFor="describe-text">Describe your character</label>
        <textarea
          id="describe-text"
          className="text-input describe-box"
          rows={3}
          value={value}
          maxLength={MAX_CHARS}
          spellCheck={false}
          autoComplete="off"
          placeholder="curly dark hair, round glasses, short beard, green jumper, brown skin"
          onChange={(event) => setValue(event.target.value)}
        />
        <span className="field-hint">
          A word list, not a model: {PHRASE_COUNT} phrases, matched against the parts the studio can draw, here
          in this tab. Anything it does not know, it says so rather than guessing.
        </span>
      </p>

      <p className="describe-actions">
        <button type="button" className="button button-quiet" onClick={surprise}>Surprise me</button>
        <button
          type="button"
          className="button button-quiet"
          onClick={() => setValue('')}
          disabled={value.length === 0}
        >
          Clear
        </button>
      </p>

      <Account note={note} />
    </div>
  )
}
