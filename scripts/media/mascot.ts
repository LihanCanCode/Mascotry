/**
 * One character, pre-rendered to its eighteen cells and then blitted per frame.
 *
 * Rendering a cell costs real time, and an animation shows the same nine poses
 * over and over, so every cell is drawn once up front. The squash on a poke
 * copies the component's own `scale(1.06, 0.94)` spring rather than inventing
 * a different one.
 */
import type { Canvas } from '@napi-rs/canvas'
import { STUDIO_PRESETS, renderCell } from '../../src/studio/index'
import type { StudioConfig } from '../../src/studio/types'
import { studioFactory, toCanvas } from './surface'
import type { Ctx2D } from './surface'

export function presetById(id: string): { readonly name: string; readonly config: StudioConfig } {
  const preset = STUDIO_PRESETS.find((p) => p.id === id)
  if (!preset) throw new Error(`no preset ${id}`)
  return preset
}

export interface MascotCells {
  readonly directions: readonly Canvas[]
  readonly reactions: readonly Canvas[]
  readonly size: number
}

export function renderCells(config: StudioConfig, size: number): MascotCells {
  const nine = (kind: 'directions' | 'reactions'): Canvas[] =>
    Array.from({ length: 9 }, (_, i) =>
      toCanvas(renderCell(config, kind, i, { cell: size, createCanvas: studioFactory })))
  return { directions: nine('directions'), reactions: nine('reactions'), size }
}

/** Mirrors `SQUASH_MS` in `src/runtime/Mascot.tsx`. */
export const SQUASH_MS = 320

/**
 * The squash amount at `elapsed` ms after a poke: out over one `SQUASH_MS`,
 * back over the next, on the component's overshooting curve.
 */
export function squashAt(elapsed: number): number {
  if (elapsed < 0 || elapsed >= SQUASH_MS * 2) return 0
  const half = elapsed < SQUASH_MS ? elapsed / SQUASH_MS : 1 - (elapsed - SQUASH_MS) / SQUASH_MS
  // cubic-bezier(.34,1.56,.64,1) overshoots; this is a close, cheap stand-in.
  return Math.sin(half * Math.PI * 0.5) * (1 + 0.35 * Math.sin(half * Math.PI))
}

export interface MascotDraw {
  /** Centre of the element, in frame coordinates. The same point `aimCell` measures from. */
  readonly cx: number
  readonly cy: number
  readonly cell: number
  /** Reaction cell to show instead of the pose, or null for the pose. */
  readonly mood: number | null
  /** 0 to 1, from `squashAt`. */
  readonly squash: number
}

export function drawMascot(ctx: Ctx2D, cells: MascotCells, at: MascotDraw): void {
  const index = at.mood ?? at.cell
  const bank = at.mood === null ? cells.directions : cells.reactions
  const frame = bank[Math.min(Math.max(index, 0), 8)]
  if (!frame) throw new Error(`no cell ${index}`)
  const sx = 1 + 0.06 * at.squash
  const sy = 1 - 0.06 * at.squash
  ctx.save()
  ctx.translate(at.cx, at.cy)
  ctx.scale(sx, sy)
  ctx.drawImage(frame, -cells.size / 2, -cells.size / 2, cells.size, cells.size)
  ctx.restore()
}
