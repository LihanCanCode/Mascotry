import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { aimCell, cellPosition, CENTRE_CELL, normaliseSettings, type AimSettings } from './aim'
import { INITIAL_POKE, poke, type PokeState } from './poke'

/**
 * A mascot that watches the pointer and reacts when poked.
 *
 * It needs two 3x3 sprite sheets: nine head poses and nine moods. Both are
 * drawn as backgrounds at 300% size on a square button, and a cell is chosen
 * by shifting the background. That keeps the whole thing to two image loads
 * and no per-frame layout work.
 */
export interface MascotProps {
  /** 3x3 sheet of head poses, row-major, straight ahead in the middle. */
  directions: string
  /** 3x3 sheet of moods, row-major. */
  reactions: string
  /** Rendered width and height in pixels. */
  size?: number
  /** What a screen reader calls it. */
  label?: string
  className?: string
  /** Tuning for how readily the head turns. */
  aim?: Partial<AimSettings>
}

const SQUASH_MS = 320

function cssUrl(href: string): string {
  // JSON quoting escapes the backslashes and double quotes that would
  // otherwise break out of url("..."), which is exactly what CSS needs.
  return `url(${JSON.stringify(href)})`
}

function prefers(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false
}

export function Mascot({
  directions,
  reactions,
  size = 128,
  label = 'mascot',
  className,
  aim,
}: MascotProps): React.JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pokeRef = useRef<PokeState>(INITIAL_POKE)
  const clearRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [cell, setCell] = useState(CENTRE_CELL)
  const [mood, setMood] = useState<number | null>(null)
  const [squashing, setSquashing] = useState(false)

  const settings = useMemo(() => normaliseSettings(aim), [aim])

  // Follow the pointer. Pointer moves arrive far faster than frames, so the
  // latest position is stashed and read once per frame instead.
  useEffect(() => {
    if (!prefers('(hover: hover) and (pointer: fine)')) return undefined

    let latest: { x: number; y: number } | null = null
    let frame = 0
    let scheduled = false

    const settle = (): void => {
      scheduled = false
      const node = buttonRef.current
      if (!node || !latest) return
      const box = node.getBoundingClientRect()
      const dx = latest.x - (box.left + box.width / 2)
      const dy = latest.y - (box.top + box.height / 2)
      setCell((previous) => aimCell(dx, dy, previous, settings))
    }

    const onMove = (event: PointerEvent): void => {
      latest = { x: event.clientX, y: event.clientY }
      if (scheduled) return
      scheduled = true
      frame = requestAnimationFrame(settle)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (scheduled) cancelAnimationFrame(frame)
    }
  }, [settings])

  useEffect(() => () => clearTimeout(clearRef.current), [])

  const onPoke = useCallback(() => {
    const result = poke(pokeRef.current, Date.now())
    pokeRef.current = result.state
    setMood(result.cell)
    if (!prefers('(prefers-reduced-motion: reduce)')) {
      setSquashing(true)
      setTimeout(() => setSquashing(false), SQUASH_MS)
    }
    clearTimeout(clearRef.current)
    clearRef.current = setTimeout(() => setMood(null), result.hold)
  }, [])

  const frame: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: size,
    height: size,
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    transform: squashing ? 'scale(1.06, 0.94)' : 'scale(1, 1)',
    transition: `transform ${SQUASH_MS}ms cubic-bezier(.34,1.56,.64,1)`,
  }

  const layer: CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundSize: '300% 300%',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'auto',
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      style={frame}
      aria-label={`Poke the ${label}`}
      onPointerDown={onPoke}
    >
      <span
        aria-hidden="true"
        style={{
          ...layer,
          backgroundImage: cssUrl(directions),
          backgroundPosition: cellPosition(cell),
          opacity: mood === null ? 1 : 0,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          ...layer,
          backgroundImage: cssUrl(reactions),
          backgroundPosition: cellPosition(mood ?? CENTRE_CELL),
          opacity: mood === null ? 0 : 1,
        }}
      />
    </button>
  )
}
