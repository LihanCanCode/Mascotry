/**
 * Reading colours out of a pixel buffer, and the one piece of colour science
 * the photo route needs: whether a pixel could be skin.
 *
 * Skin is not a colour, it is a narrow region of *chroma*. Tones from the
 * palest to the darkest sit almost on top of each other once brightness is
 * divided out, which is why the test below converts to YCbCr and looks only at
 * Cb and Cr, with a loose floor on Y to throw away pixels too dark to judge.
 */
import type { Pixels } from '../image/types'

export interface Rgb {
  readonly r: number
  readonly g: number
  readonly b: number
}

export function at(image: Pixels, x: number, y: number): Rgb {
  const i = (y * image.width + x) * 4
  return { r: image.data[i] ?? 0, g: image.data[i + 1] ?? 0, b: image.data[i + 2] ?? 0 }
}

export function lum(c: Rgb): number {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b
}

export function toHex(c: Rgb): string {
  const part = (v: number): string => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, '0')
  return `#${part(c.r)}${part(c.g)}${part(c.b)}`
}

/** Straight-line distance in RGB. Crude, but it is only ever used against a threshold. */
export function distance(a: Rgb, b: Rgb): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b)
}

function chroma(c: Rgb): { readonly cb: number; readonly cr: number } {
  return {
    cb: 128 - 0.168736 * c.r - 0.331264 * c.g + 0.5 * c.b,
    cr: 128 + 0.5 * c.r - 0.418688 * c.g - 0.081312 * c.b,
  }
}

/** True when a pixel's chroma falls in the band every human skin tone shares. */
export function isSkin(c: Rgb): boolean {
  if (lum(c) < 30) return false
  const { cb, cr } = chroma(c)
  if (cb < 77 || cb > 128) return false
  if (cr < 133 || cr > 177) return false
  // Skin always has more red than blue; this drops grey and blue-grey pixels
  // that happen to land inside the band.
  return c.r > c.b + 8
}

/**
 * The per-channel median of a set of samples.
 *
 * Per channel rather than a true multivariate median: it is one pass per
 * channel, and on a face it does the job the median is wanted for, which is
 * ignoring the highlight on the forehead and the shadow under the jaw.
 */
export function medianColour(samples: readonly Rgb[]): Rgb | null {
  if (samples.length === 0) return null
  const pick = (channel: (c: Rgb) => number): number => {
    const values = samples.map(channel).sort((a, b) => a - b)
    return values[Math.floor(values.length / 2)] ?? 0
  }
  return { r: pick((c) => c.r), g: pick((c) => c.g), b: pick((c) => c.b) }
}

export function spread(values: readonly number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/**
 * What the picture is sitting in front of, taken from the four corners.
 *
 * A median of the corners rather than a mean, so one corner holding a shoulder
 * or a lamp does not become "the background".
 */
export function backdrop(image: Pixels): Rgb {
  const w = Math.max(1, Math.floor(image.width * 0.08))
  const h = Math.max(1, Math.floor(image.height * 0.08))
  const samples: Rgb[] = []
  const corners: readonly (readonly [number, number])[] = [
    [0, 0], [image.width - w, 0], [0, image.height - h], [image.width - w, image.height - h],
  ]
  for (const [ox, oy] of corners) {
    for (let y = oy; y < oy + h; y += 2) {
      for (let x = ox; x < ox + w; x += 2) samples.push(at(image, x, y))
    }
  }
  return medianColour(samples) ?? { r: 0, g: 0, b: 0 }
}

/** How far apart two samples are allowed to be and still count as the same thing. */
export const SAME_COLOUR = 80
