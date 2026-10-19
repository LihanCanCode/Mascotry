/**
 * Form shading: the light model every solid part is painted with. One key light sits off the
 * upper left, so each form gets a broad light side, a soft terminator and a warm bounce low on
 * the shadow side. Materials differ only in how fast that falloff happens.
 */
import { boxH, boxW, measure } from './bbox'
import type { Box } from './bbox'
import { clamp, hexToRgb, hiOf, hslHex, ink, rgbToHsl, shadeOf, tone } from './draw'
import type { Build, Ctx, Material } from './types'

/** Unit direction of the key light, pointing from the form toward the lamp. */
export const LIGHT_X = -0.44
export const LIGHT_Y = -0.56

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${clamp(a, 0, 1).toFixed(3)})`
}

/**
 * Light bouncing back into the shadow: warm for fur, skin and cloth, cool for metal. Rotating the
 * hue only works on a saturated base, so a near-grey is tinted toward a fixed warm or cool hue
 * instead — otherwise a grey cat picks up whatever arbitrary hue its RGB happened to round to.
 */
export function bounceOf(base: string, mat: Material, k: number): string {
  const cool = mat === 'metal'
  const sat = rgbToHsl(hexToRgb(base))[1]
  const shade = shadeOf(base, (cool ? 1.05 : 0.95) * k)
  if (sat >= 0.16) return tone(shade, { l: 0.05 * k, h: (cool ? -22 : 14) * k, s: 0.07 * k })
  const [, , l] = rgbToHsl(hexToRgb(shade))
  return hslHex(cool ? 212 : 26, 0.16 * k, l + 0.04 * k)
}

/** The bright edge colour used for rim light: much lighter and a touch cooler than the base. */
export const rimOf = (base: string, mat: Material): string =>
  mat === 'metal' ? tone(base, { l: 0.42, s: -0.3, h: -12 }) : tone(base, { l: 0.3, s: -0.12, h: 8 })

type Stop = readonly [at: number, color: string]

function stopsFor(base: string, mat: Material, k: number): readonly Stop[] {
  const lit = hiOf(base, (mat === 'metal' ? 1.5 : 1.0) * k)
  const mid = shadeOf(base, 0.52 * k)
  const dark = shadeOf(base, (mat === 'fur' ? 1.15 : 1.0) * k)
  const bounce = bounceOf(base, mat, k)
  if (mat === 'metal') {
    // Hard specular that dies quickly, a long flat midtone, then a crisp terminator.
    return [[0, hiOf(base, 2.3 * k)], [0.09, lit], [0.17, base], [0.52, base], [0.62, mid],
      [0.82, shadeOf(base, 1.35 * k)], [0.96, shadeOf(base, 1.45 * k)], [1, bounce]]
  }
  if (mat === 'skin') {
    return [[0, lit], [0.3, base], [0.64, base], [0.86, mid], [0.97, dark], [1, bounce]]
  }
  // fur and cloth: a broad light side and a wide, gentle terminator.
  return [[0, lit], [0.26, base], [0.62, base], [0.84, mid], [0.97, dark], [1, bounce]]
}

export interface FormOptions {
  readonly base: string
  readonly mat: Material
  /** Overall shading strength; 0 leaves the form flat. */
  readonly k: number
  /** Scales how far the light reaches, to keep small parts from looking washed out. */
  readonly spread?: number
}

/**
 * A radial gradient framed on `box`, centred on the lit upper-left quadrant so distance from the
 * lamp reads as distance round the form.
 */
export function formPaint(ctx: Ctx, box: Box, o: FormOptions): CanvasGradient | string {
  if (o.k <= 0) return o.base
  const w = boxW(box), h = boxH(box)
  const r = Math.max(w, h, 1) * 0.5 * (o.spread ?? 1)
  const lx = box.x0 + w * 0.5 + LIGHT_X * w * 0.42
  const ly = box.y0 + h * 0.5 + LIGHT_Y * h * 0.42
  const g = ctx.createRadialGradient(lx, ly, r * 0.04, lx, ly, r * 1.72)
  for (const [at, color] of stopsFor(o.base, o.mat, o.k)) g.addColorStop(at, color)
  return g
}

/** Fill a build with its form gradient. */
export function fillForm(ctx: Ctx, build: Build, o: FormOptions, rule: CanvasFillRule = 'nonzero'): void {
  ctx.fillStyle = formPaint(ctx, measure(build), o)
  ctx.beginPath(); build(ctx); ctx.fill(rule)
}

export interface OccludeOptions {
  readonly color: string
  readonly alpha: number
  readonly dx: number
  readonly dy: number
  /** More steps make a wider, smoother falloff; cost is one fill each. */
  readonly steps?: number
  readonly rule?: CanvasFillRule
}

/**
 * Soft contact shadow cast by `build` onto whatever is already painted. Several offset copies
 * stack up, so the darkening is strongest right against the occluding shape and fades out.
 * Call inside a clip: the shadow is not masked to anything itself.
 */
export function occlude(ctx: Ctx, build: Build, o: OccludeOptions): void {
  const steps = o.steps ?? 3
  ctx.save()
  ctx.globalAlpha = clamp(o.alpha, 0, 1) / steps
  ctx.fillStyle = o.color
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    ctx.save(); ctx.translate(o.dx * t, o.dy * t)
    ctx.beginPath(); build(ctx); ctx.fill(o.rule ?? 'nonzero')
    ctx.restore()
  }
  ctx.restore()
}

/**
 * Thin bright edge along the lit side: the shape's own outline, nudged away from the lamp and
 * clipped back to the shape, so only the sliver facing the light survives.
 */
export function rimLight(ctx: Ctx, build: Build, color: string, w: number, alpha: number): void {
  if (alpha <= 0 || w <= 0) return
  ctx.save()
  ctx.beginPath(); build(ctx); ctx.clip()
  ctx.translate(-LIGHT_X * w * 1.5, -LIGHT_Y * w * 1.5)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color; ctx.lineWidth = w * 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  ctx.beginPath(); build(ctx); ctx.stroke()
  ctx.restore()
}

/** The light model a part is painted with; absent means keep the old flat two-tone fill. */
export interface FormSpec {
  readonly mat: Material
  readonly k: number
  readonly spread?: number
  /** Strength of the rim light on the lit edge; 0 for parts that sit behind others. */
  readonly rim?: number
}

export interface ShadedOptions {
  readonly base: string
  readonly shade: string
  readonly line: string
  readonly w?: number
  /** Light direction for the flat fallback fill, unused once `form` is given. */
  readonly off?: readonly [number, number]
  readonly rule?: CanvasFillRule
  readonly form?: FormSpec
  /** Highlights, drawn clipped to the shape between the fills and the outline. */
  readonly hi?: (ctx: Ctx) => void
}

/** The flat predecessor: shade fill, then the base colour shifted up-left and clipped. */
function flatFill(ctx: Ctx, build: Build, o: ShadedOptions, rule: CanvasFillRule): void {
  const off = o.off ?? [-6, -8]
  ink(ctx, build, { fill: o.shade, fillOnly: true, rule })
  ctx.save(); ctx.beginPath(); build(ctx); ctx.clip(rule)
  ctx.translate(off[0], off[1]); ctx.fillStyle = o.base; ctx.beginPath(); build(ctx); ctx.fill(rule)
  ctx.restore()
}

/** Volume fill (gradient or flat), clipped highlights, rim light on the lit edge, then the outline. */
export function shadedInk(ctx: Ctx, build: Build, o: ShadedOptions): void {
  const { base, line, w = 6, rule = 'nonzero', hi, form } = o
  if (form && form.k > 0) fillForm(ctx, build, { base, mat: form.mat, k: form.k, spread: form.spread }, rule)
  else flatFill(ctx, build, o, rule)
  if (hi) {
    ctx.save(); ctx.beginPath(); build(ctx); ctx.clip(rule); hi(ctx); ctx.restore()
  }
  const rim = form?.rim ?? 0
  if (rim > 0) rimLight(ctx, build, rimOf(base, form?.mat ?? 'cloth'), 3.4, rim * 0.72)
  ink(ctx, build, { line, w })
}
