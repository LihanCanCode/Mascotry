import { useCallback, useRef } from 'react'
import type { Door } from '../state/reducer'

interface DoorChoice {
  readonly id: Door
  readonly label: string
  readonly note: string
}

/** The three ways in, equal in weight. Each one lands in the same Tune panel. */
export const DOORS: readonly DoorChoice[] = Object.freeze([
  { id: 'pick', label: 'Pick one', note: 'Fifty-seven characters, each one a saved set of parts.' },
  { id: 'describe', label: 'Describe it', note: 'Type what it looks like. The words are matched to parts, here.' },
  { id: 'photo', label: 'From a photo', note: 'Drop in a photo. It is read in this tab and never uploaded.' },
])

const STEPS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

interface DoorTabsProps {
  readonly open: Door
  readonly onOpen: (door: Door) => void
}

/**
 * The doors, as a tab set.
 *
 * A tab set rather than three links, because only one can be open and the
 * panel below belongs to it. That means the pattern's keyboard contract: one
 * tab stop, and the arrows move the open door and the focus together — the
 * same roving tabindex the character grid uses.
 */
export function DoorTabs({ open, onOpen }: DoorTabsProps): React.JSX.Element {
  const nodes = useRef(new Map<Door, HTMLButtonElement>())

  const register = useCallback((id: Door, node: HTMLButtonElement | null): void => {
    if (node === null) nodes.current.delete(id)
    else nodes.current.set(id, node)
  }, [])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      const step = STEPS[event.key]
      if (step === undefined) return
      const from = DOORS.findIndex((door) => door.id === open)
      const next = DOORS[(from + step + DOORS.length) % DOORS.length]
      if (next === undefined) return
      event.preventDefault()
      onOpen(next.id)
      nodes.current.get(next.id)?.focus()
    },
    [open, onOpen],
  )

  return (
    <div className="doors" role="tablist" aria-label="How to start">
      {DOORS.map((door) => (
        <button
          key={door.id}
          type="button"
          role="tab"
          id={`door-${door.id}`}
          className="door"
          aria-selected={door.id === open}
          aria-controls="door-panel"
          tabIndex={door.id === open ? 0 : -1}
          ref={(node) => register(door.id, node)}
          onClick={() => onOpen(door.id)}
          onKeyDown={onKeyDown}
        >
          <span className="door-label">{door.label}</span>
          <span className="door-note">{door.note}</span>
        </button>
      ))}
    </div>
  )
}
