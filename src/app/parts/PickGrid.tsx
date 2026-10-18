import { useCallback, useRef } from 'react'
import { STUDIO_PRESETS, renderCell } from '../../studio'
import type { StudioPreset } from '../../studio/presets'
import { canvasFactory } from '../../studio/browser'
import type { Pixels } from '../../image/types'
import { useNearViewport } from '../hooks/useNearViewport'
import type { ThumbCache } from '../state/thumbs'
import { PixelCanvas } from './PixelCanvas'

/** Index 4 of the poses sheet is the straight-ahead look. */
const STRAIGHT_AHEAD = 4
const THUMB_PIXELS = 128
const THUMB_DISPLAY = 96

interface CardProps {
  readonly preset: StudioPreset
  readonly picked: boolean
  readonly cache: ThumbCache
  readonly tabIndex: number
  readonly onPick: (id: string) => void
  readonly onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void
  readonly register: (id: string, node: HTMLButtonElement | null) => void
}

/** The thumbnail, drawn once per character and kept. Null when no canvas works. */
function thumbnail(preset: StudioPreset, cache: ThumbCache): Pixels | null {
  try {
    return cache.get(preset.id, () =>
      renderCell(preset.config, 'directions', STRAIGHT_AHEAD, {
        cell: THUMB_PIXELS,
        createCanvas: canvasFactory(),
      }))
  } catch {
    // No 2D canvas: the card still works, it just shows its name.
    return null
  }
}

function PresetCard({ preset, picked, cache, tabIndex, onPick, onKeyDown, register }: CardProps): React.JSX.Element {
  const ref = useRef<HTMLButtonElement>(null)
  const near = useNearViewport(ref)
  const image = near ? thumbnail(preset, cache) : null

  return (
    <button
      type="button"
      role="radio"
      aria-checked={picked}
      tabIndex={tabIndex}
      ref={(node) => {
        ref.current = node
        register(preset.id, node)
      }}
      className="card"
      onClick={() => onPick(preset.id)}
      onKeyDown={onKeyDown}
      data-preset={preset.id}
    >
      <span className="card-pegs" aria-hidden="true" />
      <span className="card-art" style={{ width: THUMB_DISPLAY, height: THUMB_DISPLAY }}>
        {image === null
          ? <span className="card-art-empty" aria-hidden="true" />
          : <PixelCanvas image={image} display={THUMB_DISPLAY} alt={`${preset.name}, looking straight ahead`} />}
      </span>
      <span className="card-name">{preset.name}</span>
      <span className="card-tag">{preset.tag}</span>
      {picked ? <span className="card-picked">Picked</span> : null}
    </button>
  )
}

interface PickGridProps {
  readonly pickedId: string
  readonly cache: ThumbCache
  readonly onPick: (id: string) => void
}

/** Where the arrow keys should land from `from`, given how many cards there are. */
function nextIndex(key: string, from: number, total: number): number | null {
  if (key === 'ArrowRight' || key === 'ArrowDown') return (from + 1) % total
  if (key === 'ArrowLeft' || key === 'ArrowUp') return (from - 1 + total) % total
  if (key === 'Home') return 0
  if (key === 'End') return total - 1
  return null
}

/**
 * The fourteen characters, as one radio group.
 *
 * A radio group rather than fourteen buttons, because only one can be picked
 * and a reader who tabs in should be able to arrow through the set instead of
 * tabbing past every card to reach the rest of the page. That means a roving
 * tabindex: the picked card is the only tab stop, and the arrows move the
 * selection and the focus together, which is what the pattern asks for.
 */
export function PickGrid({ pickedId, cache, onPick }: PickGridProps): React.JSX.Element {
  const nodes = useRef(new Map<string, HTMLButtonElement>())

  const register = useCallback((id: string, node: HTMLButtonElement | null): void => {
    if (node === null) nodes.current.delete(id)
    else nodes.current.set(id, node)
  }, [])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      const from = STUDIO_PRESETS.findIndex((preset) => preset.id === event.currentTarget.dataset['preset'])
      const target = from < 0 ? null : nextIndex(event.key, from, STUDIO_PRESETS.length)
      if (target === null) return
      event.preventDefault()
      const preset = STUDIO_PRESETS[target]
      if (preset === undefined) return
      onPick(preset.id)
      nodes.current.get(preset.id)?.focus()
    },
    [onPick],
  )

  return (
    <div className="grid" role="radiogroup" aria-label="Character">
      {STUDIO_PRESETS.map((preset) => (
        <PresetCard
          key={preset.id}
          preset={preset}
          picked={preset.id === pickedId}
          cache={cache}
          tabIndex={preset.id === pickedId ? 0 : -1}
          onPick={onPick}
          onKeyDown={onKeyDown}
          register={register}
        />
      ))}
    </div>
  )
}
