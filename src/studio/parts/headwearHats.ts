/**
 * Hats that are a crown plus, sometimes, a brim: toque, hard hat, straw hat, beret and surgical
 * cap. Each one is given a form gradient and a brim that foreshortens with the turn, so none of
 * them collapses into a decal when the head looks away.
 */
import { ellipse, ink, mix, smooth, unionInk } from '../draw'
import { shadedInk } from '../shade'
import type { Build, Ctx, Headwear, Rig } from '../types'
import { domeBuild, hatKit, plateDisc, strokeSpherePath } from './headwearShape'
import type { DomeSpec } from './headwearShape'
import type { HatKit, Plate } from './headwearShape'

/** The two brims in this module, as discs rather than as latitudes. */
const HARD_BRIM: Plate = { h: 0.6, r: 1.1, inner: 0.84, drop: 30 }
const STRAW_BRIM: Plate = { h: 0.8, r: 1.45, inner: 0.84, drop: 58 }

/** Crown geometry per hat, so the dispatcher below stays a table rather than a staircase. */
const CROWNS: Partial<Record<Headwear, DomeSpec>> = {
  toque: { crown: 1.12, band: 0.9, depth: 1.06, trim: 0.42 },
  hardHat: { crown: 1.16, band: 0.82, depth: 1.08 },
  strawHat: { crown: 1.3, band: 1.02, depth: 1.06, trim: 0.72 },
  surgicalCap: { crown: 1.12, band: 0.74, depth: 1.06 },
  beret: { crown: 1.08, band: 0.88, depth: 1.05 },
}

const crownBuild = (R: Rig, hw: Headwear): Build =>
  domeBuild(R, CROWNS[hw] ?? { crown: 1.1, band: 0.78, depth: 1.04 })

function paintCrown(ctx: Ctx, R: Rig, kit: HatKit, build: Build, spread: number): void {
  shadedInk(ctx, build, {
    base: kit.base, shade: kit.shade, line: kit.line, w: 7, off: [-8, -9],
    form: { mat: 'cloth', k: R.k, spread, rim: R.cfg.rimLight * 0.9 },
  })
}

/** The brim goes down as a solid disc and the crown is painted over it: an annulus thin enough
 * to clear the crown has no front edge left to read as a brim. */
function paintBrim(ctx: Ctx, R: Rig, kit: HatKit, build: Build, mat: 'cloth' | 'metal'): void {
  shadedInk(ctx, build, {
    base: kit.base, shade: kit.shade, line: kit.line, w: 7, off: [-4, -5],
    form: { mat, k: R.k, spread: 1.8, rim: R.cfg.rimLight * 0.7 },
  })
}

/** The chef's tall gathered puff: a ring of lobes unioned into one soft crown. */
function drawToque(ctx: Ctx, R: Rig, kit: HatKit): void {
  paintCrown(ctx, R, kit, crownBuild(R, 'toque'), 1.2)
  const P = R.proj(0, 1.5, 1.08)
  const lift = 14 + 6 * R.dy
  const wide = Math.max(P.sx, 0.95)
  const puff: Build[] = [(c) => ellipse(c, P.x, P.y - lift * 0.3, 104 * wide, 50)]
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6) * Math.PI
    puff.push((c) => ellipse(c, P.x + Math.cos(a) * 74 * wide, P.y - lift + Math.sin(a) * 21, 33, 30))
  }
  unionInk(ctx, puff, { fill: kit.base, line: kit.line, w: 6.5 })
  ctx.strokeStyle = kit.shade; ctx.lineWidth = 5; ctx.lineCap = 'round'
  for (const t of [-0.7, 0, 0.7]) strokeSpherePath(ctx, R, [[t, 0.92], [t * 0.8, 1.2], [t * 0.5, 1.46]], 1.09)
  ctx.strokeStyle = kit.hi; ctx.globalAlpha = 0.6; ctx.lineWidth = 8
  ctx.beginPath(); ellipse(ctx, P.x - 32, P.y - lift - 2, 17, 8, -0.4); ctx.stroke(); ctx.globalAlpha = 1
}

/** Site helmet: a shell with a reinforcing ridge and a short peak all the way round. */
function drawHardHat(ctx: Ctx, R: Rig, kit: HatKit): void {
  paintCrown(ctx, R, kit, crownBuild(R, 'hardHat'), 1.1)
  paintBrim(ctx, R, kit, plateDisc(R, HARD_BRIM), 'metal')
  ctx.strokeStyle = kit.shade; ctx.lineWidth = 9; ctx.lineCap = 'round'
  strokeSpherePath(ctx, R, [[0, 0.9], [0, 1.2], [0, 1.5]], 1.12)
  ctx.strokeStyle = kit.hi; ctx.lineWidth = 6; ctx.globalAlpha = 0.65
  strokeSpherePath(ctx, R, [[-0.95, 0.95], [-0.6, 1.2], [-0.2, 1.33]], 1.12)
  ctx.globalAlpha = 1
}

/** A wide woven brim and a shallow crown, with the weave suggested by two concentric rings. */
function drawStrawHat(ctx: Ctx, R: Rig, kit: HatKit): void {
  paintCrown(ctx, R, kit, crownBuild(R, 'strawHat'), 1.25)
  ctx.strokeStyle = mix(kit.shade, R.pal.accent, 0.7); ctx.lineWidth = 15; ctx.lineCap = 'butt'
  strokeSpherePath(ctx, R, [[-1.15, 1.08], [0, 1.04], [1.15, 1.08]], 1.09)
  // The brim is in front of the crown it carries, so it goes down last and keeps its own outline.
  paintBrim(ctx, R, kit, plateDisc(R, STRAW_BRIM), 'cloth')
  ctx.save(); ctx.beginPath(); plateDisc(R, STRAW_BRIM)(ctx); ctx.clip()
  ctx.strokeStyle = kit.shade; ctx.lineWidth = 4; ctx.globalAlpha = 0.7
  for (const r of [1.14, 1.3]) { ctx.beginPath(); plateDisc(R, { ...STRAW_BRIM, r })(ctx); ctx.stroke() }
  ctx.globalAlpha = 1; ctx.restore()
}

/** A flat disc worn level, with the little stalk at its centre. */
function drawBeret(ctx: Ctx, R: Rig, kit: HatKit): void {
  const P = R.proj(0, 1.32, 1.06)
  const disc: Build = (c) => ellipse(c, P.x, P.y + 6, 118 * Math.max(P.sx, 0.52), 44)
  shadedInk(ctx, (c) => { crownBuild(R, 'beret')(c); disc(c) }, {
    base: kit.base, shade: kit.shade, line: kit.line, w: 7, off: [-7, -8],
    form: { mat: 'cloth', k: R.k, spread: 1.3, rim: R.cfg.rimLight * 0.9 },
  })
  ink(ctx, (c) => ellipse(c, P.x, P.y - 10, 11, 9), { fill: kit.shade, line: kit.line, w: 4.5, swell: 0.3 })
  ctx.strokeStyle = kit.hi; ctx.globalAlpha = 0.55; ctx.lineWidth = 7; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.ellipse(P.x - 36, P.y + 2, 30, 15, -0.3, 0.4, 2.4); ctx.stroke(); ctx.globalAlpha = 1
}

/** Theatre cap: a gathered shell with an elastic edge and a tie at the back of the head. */
function drawSurgicalCap(ctx: Ctx, R: Rig, kit: HatKit): void {
  paintCrown(ctx, R, kit, crownBuild(R, 'surgicalCap'), 1.3)
  ctx.lineCap = 'round'
  ctx.strokeStyle = kit.shade; ctx.lineWidth = 5
  for (const t of [-1.05, -0.5, 0.5, 1.05]) strokeSpherePath(ctx, R, [[t, 0.78], [t * 0.9, 1.0], [t * 0.7, 1.28]], 1.08)
  ctx.strokeStyle = kit.line; ctx.lineWidth = 7; ctx.globalAlpha = 0.5
  strokeSpherePath(ctx, R, [[-1.5, 0.74], [0, 0.7], [1.5, 0.74]], 1.07)
  ctx.globalAlpha = 1
  ctx.strokeStyle = kit.hi; ctx.lineWidth = 9; ctx.globalAlpha = 0.5
  strokeSpherePath(ctx, R, [[-1.0, 0.9], [-0.55, 1.2], [-0.1, 1.33]], 1.09)
  ctx.globalAlpha = 1
}

const HAT_DRAW: Partial<Record<Headwear, (ctx: Ctx, R: Rig, kit: HatKit) => void>> = {
  toque: drawToque, hardHat: drawHardHat, strawHat: drawStrawHat, beret: drawBeret,
  surgicalCap: drawSurgicalCap,
}

export const isHat = (hw: Headwear): boolean => hw in HAT_DRAW

/** The crown shape these hats cast a forehead shadow from. */
export const hatShadowBuild = (R: Rig): Build => {
  const hw = R.cfg.headwear
  if (hw === 'strawHat') return plateDisc(R, STRAW_BRIM)
  if (hw === 'hardHat') return plateDisc(R, HARD_BRIM)
  return crownBuild(R, hw)
}

export function drawHat(ctx: Ctx, R: Rig): void {
  const draw = HAT_DRAW[R.cfg.headwear]
  if (draw) draw(ctx, R, hatKit(R))
}

