/**
 * Test- and script-only canvas factory backed by @napi-rs/canvas (native Skia,
 * installed on D: via pnpm).
 *
 * Skia surfaces are never handed back to the OS for the life of the process.
 * V8 sees only a few bytes of JS wrapper, so it feels no pressure to collect
 * one, and an explicit `global.gc()` does not release the surface either. A
 * fresh canvas per draw therefore accumulates: measured here, a bare loop over
 * `createCanvas` dies at 8527 canvases of 512 px, 2159 of 1024 px and 33466 of
 * 256 px -- about 8.5 GB of surface every time, i.e. the process commit limit,
 * whereupon Skia answers `Create skia surface failed`. A suite long enough to
 * approach that limit fails in whichever test happens to draw next, which is
 * why the symptom looked like unrelated assertion failures.
 *
 * So canvases are pooled by size and reused. `ctx.reset()` is a full reset --
 * pixels cleared, transform back to identity, state stack emptied, clip and
 * styles back to their defaults -- which is what makes a recycled canvas
 * indistinguishable from a new one.
 *
 * The contract: a canvas from here is on loan until `releaseTestCanvases()`,
 * which `testCanvasSetup.ts` runs after every test. Nothing may keep one past
 * the end of the test that asked for it, and nothing in the studio does: both
 * `renderSheet` and `renderCell` drop every canvas they make before returning.
 */
import { createCanvas } from '@napi-rs/canvas'
import type { CanvasFactory, CanvasLike } from './types'

const idle = new Map<string, CanvasLike[]>()
const onLoan: CanvasLike[] = []

function sizeKey(width: number, height: number): string {
  return `${width}x${height}`
}

function surfaceBytes(canvases: readonly CanvasLike[]): number {
  return canvases.reduce((sum, c) => sum + c.width * c.height * 4, 0)
}

function idleCanvases(): CanvasLike[] {
  return [...idle.values()].flat()
}

/** Total surface this factory is holding, pooled and on loan, in MB. */
function heldMb(): string {
  const bytes = surfaceBytes(onLoan) + surfaceBytes(idleCanvases())
  return (bytes / 1e6).toFixed(0)
}

function exhausted(width: number, height: number, cause: unknown): Error {
  return new Error(
    `could not create a ${width}x${height} canvas: the native Skia surface allocator refused it. ` +
      `This is resource exhaustion, not a drawing fault -- surfaces are never freed by the ` +
      `library, and this process is already holding ${heldMb()} MB of them ` +
      `(${onLoan.length} on loan, ${idleCanvases().length} pooled). Either a caller is keeping ` +
      `canvases past the test that asked for them, so the pool cannot recycle, or something is ` +
      `creating canvases outside this factory.`,
    { cause },
  )
}

function allocate(width: number, height: number): CanvasLike {
  try {
    return createCanvas(width, height) as unknown as CanvasLike
  } catch (cause: unknown) {
    throw exhausted(width, height, cause)
  }
}

/** Clear pixels, transform, clip, styles and the saved-state stack. */
function blank(canvas: CanvasLike, width: number, height: number): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(`a ${width}x${height} canvas came back without a 2D context`)
  ctx.reset()
}

/**
 * A blank `width` x `height` canvas, recycled from the pool when one of that
 * size is idle. On loan until `releaseTestCanvases()`.
 */
export const nodeCanvasFactory: CanvasFactory = (width, height) => {
  const key = sizeKey(width, height)
  const pooled = idle.get(key)?.pop()
  const canvas = pooled ?? allocate(width, height)
  blank(canvas, width, height)
  onLoan.push(canvas)
  return canvas
}

/** Take every loaned canvas back into the pool. Safe to call when nothing is out. */
export function releaseTestCanvases(): void {
  for (const canvas of onLoan.splice(0)) {
    const key = sizeKey(canvas.width, canvas.height)
    const bucket = idle.get(key)
    if (bucket) bucket.push(canvas)
    else idle.set(key, [canvas])
  }
}

/** How many native canvases exist, for the test that proves the pool recycles. */
export function testCanvasCount(): number {
  return onLoan.length + idleCanvases().length
}
