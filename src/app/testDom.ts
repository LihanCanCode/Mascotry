/**
 * Test-only: gives jsdom the few browser pieces this app actually needs.
 *
 * jsdom has no 2D canvas, no `ImageData` and no object URLs, so without this the
 * components could only ever be tested against their own failure paths. Backing
 * each `<canvas>` with @napi-rs/canvas — the same engine the studio tests draw
 * on — means the app under test runs the real rendering pipeline.
 *
 * The one piece of glue worth explaining: the studio draws the body once and
 * blits that canvas into all eighteen cells, and the native `drawImage` will
 * not accept a jsdom element. So the context handed back here swaps any
 * `<canvas>` passed to `drawImage` for the native canvas standing behind it.
 */
import { Canvas, createCanvas, ImageData as NapiImageData } from '@napi-rs/canvas'

// createCanvas is overloaded and can also yield an SVG canvas; this harness only
// ever wants the raster one.
type NativeCanvas = Canvas
type Ctx2d = CanvasRenderingContext2D

interface Backing {
  readonly canvas: NativeCanvas
  readonly ctx: Ctx2d
}

const backings = new WeakMap<HTMLCanvasElement, Backing>()
const issued: string[] = []
const revoked: string[] = []

/** A jsdom canvas standing in for a native one, resolved to the native one. */
function unwrap(source: unknown): unknown {
  return source instanceof HTMLCanvasElement ? (backings.get(source)?.canvas ?? source) : source
}

function makeBacking(element: HTMLCanvasElement): Backing {
  const canvas = createCanvas(element.width || 1, element.height || 1) as NativeCanvas
  const ctx = canvas.getContext('2d') as unknown as Ctx2d
  const native = ctx.drawImage.bind(ctx) as (...args: unknown[]) => void
  const patched = (source: unknown, ...rest: unknown[]): void => native(unwrap(source), ...rest)
  Object.defineProperty(ctx, 'drawImage', { value: patched, writable: true, configurable: true })
  return { canvas, ctx }
}

function backingFor(element: HTMLCanvasElement): Backing {
  const held = backings.get(element)
  if (held !== undefined) return held
  const made = makeBacking(element)
  backings.set(element, made)
  return made
}

/** Install the canvas, ImageData and object-URL stand-ins. Safe to call repeatedly. */
export function installBrowserBits(): void {
  const globals = globalThis as unknown as { ImageData?: unknown; OffscreenCanvas?: unknown }
  globals.ImageData = NapiImageData
  // Force the <canvas> path in the studio's browser adapter: the one a page
  // without OffscreenCanvas would take.
  delete globals.OffscreenCanvas

  HTMLCanvasElement.prototype.getContext = function getContext(
    this: HTMLCanvasElement,
    kind: string,
  ): Ctx2d | null {
    return kind === '2d' ? backingFor(this).ctx : null
  } as HTMLCanvasElement['getContext']

  HTMLCanvasElement.prototype.toBlob = function toBlob(
    this: HTMLCanvasElement,
    callback: BlobCallback,
    type?: string,
  ): void {
    // Separate calls rather than one with a variable: the encoders are declared
    // as distinct overloads, PNG apart from the lossy formats.
    const canvas = backingFor(this).canvas
    const png = type === 'image/png'
    const buffer = png ? canvas.toBuffer('image/png') : canvas.toBuffer('image/webp')
    callback(new Blob([new Uint8Array(buffer)], { type: png ? 'image/png' : 'image/webp' }))
  }

  URL.createObjectURL = (blob: Blob): string => {
    const url = `blob:mascotry/${issued.length}/${blob.type}`
    issued.push(url)
    return url
  }
  URL.revokeObjectURL = (url: string): void => {
    revoked.push(url)
  }
}

export function objectUrls(): { readonly issued: readonly string[]; readonly revoked: readonly string[] } {
  return { issued, revoked }
}

export function resetObjectUrls(): void {
  issued.length = 0
  revoked.length = 0
}
