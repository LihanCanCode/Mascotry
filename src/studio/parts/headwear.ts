// Headwear: cap, beanie (thick cuff + fluffy pom-pom), antenna, hijab (simple headscarf).
import { TAU, clamp, ellipse, ink, smooth, unionInk } from '../draw'
import { occlude, shadedInk } from '../shade'
import type { Build, Ctx, Pt, Rig, SpherePt } from '../types'
import { L_TEMPLE, R_TEMPLE, arcPts } from './hairGeometry'

const HIJAB_WINDOW: readonly SpherePt[] = [
  [0, 1.02], [0.55, 0.96], [1.0, 0.72], [1.3, 0.25], [1.32, -0.3], [1.12, -0.8], [0.62, -1.12], [0, -1.24],
  [-0.62, -1.12], [-1.12, -0.8], [-1.32, -0.3], [-1.3, 0.25], [-1.0, 0.72], [-0.55, 0.96],
]

const edgeList = (phi: number, wobble = 0): SpherePt[] => {
  const out: SpherePt[] = []
  for (let t = -1.55; t <= 1.56; t += 0.2) out.push([t, phi + wobble * Math.cos(t * 2)])
  return out
}

/** Dome outline for cap / beanie: silhouette arc over the top, hairline-parallel lower edge. */
/** Latitude the cap's band sits at; high enough to leave the brim a band of forehead to sit on. */
const CAP_BAND = 0.78

function domeBuild(R: Rig): Build {
  const beanie = R.cfg.headwear === 'beanie'
  const outer = arcPts(R, L_TEMPLE - 0.08, R_TEMPLE + 0.08, 16, beanie ? 1.13 : 1.1)
  const lower = R.pts(edgeList(beanie ? 0.98 : CAP_BAND, beanie ? 0 : 0.04), 1.04, true)
  const all = [...outer, ...lower.slice().reverse()]
  return (c) => smooth(c, all)
}

function hijabBuild(R: Rig): Build {
  const N = 48
  const outer = Array.from({ length: N }, (_, i) => {
    const t = (i / N) * TAU
    return R.sil(t, 1.12 - 0.09 * Math.max(0, Math.sin(t)) ** 2, 0, -2)
  })
  const win = R.pts(HIJAB_WINDOW, 1.0, true)
  return (c) => { smooth(c, outer); smooth(c, win) }
}

/** The region of the face the headwear shades (cast shadow on the forehead). */
export function drawHeadwearCastShadow(ctx: Ctx, R: Rig): void {
  const hw = R.cfg.headwear
  if (hw === 'hijab') {
    ctx.save(); ctx.strokeStyle = R.pal.skinDeep; ctx.globalAlpha = 0.4; ctx.lineWidth = 20; ctx.lineJoin = 'round'
    ctx.beginPath(); smooth(ctx, R.pts(HIJAB_WINDOW, 1.0, true)); ctx.stroke(); ctx.restore()
    return
  }
  if (hw !== 'cap' && hw !== 'beanie') return
  const k = Math.min(1, R.k || 1)
  occlude(ctx, domeBuild(R), { color: R.pal.skinDeep, alpha: 0.62 * k, dx: 0, dy: 17, steps: 5 })
  // A brim throws its own shadow further down the forehead than the band it is attached to.
  if (hw === 'cap') occlude(ctx, brimBuild(R), { color: R.pal.skinDeep, alpha: 0.5 * k, dx: 0, dy: 20, steps: 4 })
}

export function drawHeadwearBack(ctx: Ctx, R: Rig): void {
  const { cfg, pal } = R
  if (cfg.headwear !== 'antenna') return
  const P = R.proj(0, 1.5, 1.0)
  const top = { x: P.x + R.dx * 8, y: P.y - 58 }
  ctx.strokeStyle = pal.line; ctx.lineWidth = 12; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(P.x, P.y + 12); ctx.lineTo(top.x, top.y); ctx.stroke()
  ctx.strokeStyle = pal.skinShade; ctx.lineWidth = 5
  ctx.beginPath(); ctx.moveTo(P.x, P.y + 12); ctx.lineTo(top.x, top.y); ctx.stroke()
  ink(ctx, (c) => ellipse(c, top.x, top.y - 8, 17, 17), { fill: pal.accent, line: pal.lineAccent, w: 6, swell: 0.4 })
  ctx.fillStyle = '#fff'; ctx.beginPath(); ellipse(ctx, top.x - 6, top.y - 14, 5, 3.5, -0.5); ctx.fill()
}

function strokeSpherePath(ctx: Ctx, R: Rig, list: readonly SpherePt[], depth: number): void {
  const p = R.pts(list, depth, true)
  ctx.beginPath(); smooth(ctx, p, false); ctx.stroke()
}

function drawDomeBody(ctx: Ctx, R: Rig): void {
  const { pal } = R
  const bandPhi = R.cfg.headwear === 'cap' ? CAP_BAND : 0.98
  shadedInk(ctx, domeBuild(R), {
    base: pal.hat, shade: pal.hatShade, line: pal.lineHat, w: 7, off: [-8, -9],
    form: { mat: 'cloth', k: R.k, spread: 1.2, rim: R.cfg.rimLight * 0.9 },
  })
  ctx.strokeStyle = pal.hatShade; ctx.lineWidth = 4; ctx.lineCap = 'round'
  for (const t of [-0.75, 0, 0.75]) strokeSpherePath(ctx, R, [[t, bandPhi], [t * 0.6, 1.05], [0, 1.52]], 1.07)
  ctx.strokeStyle = pal.hatHi; ctx.lineWidth = 7
  strokeSpherePath(ctx, R, [[-0.9, 1.1], [-0.55, 1.2], [-0.2, 1.26]], 1.07)
}

function drawPomPom(ctx: Ctx, R: Rig): void {
  const { pal } = R
  const P = R.proj(0, 1.5, 1.2)
  R.at(ctx, P, 0, () => {
    const balls: Build[] = [(c) => ellipse(c, 0, 0, 24, 22)]
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU
      balls.push((c) => ellipse(c, Math.cos(a) * 22, Math.sin(a) * 20, 12, 12))
    }
    unionInk(ctx, balls, { fill: pal.accent, line: pal.lineAccent, w: 5 })
    ctx.strokeStyle = pal.accentShade; ctx.lineWidth = 4; ctx.lineCap = 'round'
    for (let i = 0; i < 9; i += 2) {
      const a = (i / 9) * TAU
      ctx.beginPath(); ctx.arc(Math.cos(a) * 22, Math.sin(a) * 20, 6, a + 0.6, a + 2.2); ctx.stroke()
    }
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ellipse(ctx, -9, -10, 8, 4.5, -0.5); ctx.fill()
  }, Math.max(P.sx, 0.8))
}

function drawBeanieCuff(ctx: Ctx, R: Rig): void {
  const { pal } = R
  const top = R.pts(edgeList(0.98), 1.08, true)
  const bottom = R.pts(edgeList(0.58), 1.08, true)
  const cuff: Build = (c) => smooth(c, [...top, ...bottom.slice().reverse()])
  shadedInk(ctx, cuff, {
    base: pal.accent, shade: pal.accentShade, line: pal.lineAccent, w: 7, off: [-5, -7],
    form: { mat: 'cloth', k: R.k, spread: 1.5 },
    hi: (c) => {
      c.strokeStyle = pal.accentShade; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath()
      for (let t = -1.4; t <= 1.4; t += 0.24) {
        const a = R.proj(t, 0.98, 1.08, true), b = R.proj(t, 0.58, 1.08, true)
        if (a.z > 0.08) { c.moveTo(a.x, a.y + 4); c.lineTo(b.x, b.y - 4) }
      }
      c.stroke()
    },
  })
}

/** How far the brim's front edge is pushed down the forehead when the head faces the viewer. */
const BRIM_DROP = 20
const BRIM_SPAN = 1.12

/**
 * A brim is a flat plate pointing straight at the viewer, and an orthographic projection collapses
 * that to a hairline — which is exactly what the cap used to look like from the front. So the
 * front-facing part of its depth is drawn instead of projected: the outer edge is pushed down the
 * forehead by an amount that fades away as the head turns and the projection takes over.
 */
function brimEdges(R: Rig): { readonly inner: Pt[]; readonly outer: Pt[] } {
  const front = clamp(R.proj(0, 0, 1).z, 0, 1)
  const n = 10
  const inner: Pt[] = [], outer: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = -BRIM_SPAN + (2 * BRIM_SPAN * i) / n
    const u = t / BRIM_SPAN
    inner.push(R.proj(t, CAP_BAND, 1.04, true))
    const o = R.proj(t, 0.5, 1.2, true)
    outer.push({ x: o.x, y: o.y + BRIM_DROP * front * (1 - 0.55 * u * u) })
  }
  return { inner, outer }
}

const brimBuild = (R: Rig): Build => {
  const { inner, outer } = brimEdges(R)
  return (c) => smooth(c, [...inner, ...outer.slice().reverse()])
}

function drawCapBrim(ctx: Ctx, R: Rig): void {
  const { pal } = R
  const { inner, outer } = brimEdges(R)
  const seam = outer.map((p, i) => ({ x: (p.x * 5 + (inner[i]?.x ?? p.x)) / 6, y: (p.y * 5 + (inner[i]?.y ?? p.y)) / 6 }))
  shadedInk(ctx, brimBuild(R), {
    base: pal.hat, shade: pal.hatShade, line: pal.lineHat, w: 7, off: [-3, -4],
    form: { mat: 'cloth', k: R.k, spread: 1.7, rim: R.cfg.rimLight * 0.7 },
    hi: (c) => {
      // We see the top of the plate lit and the sliver of its underside dark; a stitched seam
      // running parallel to the front edge is what names the shape as a brim.
      c.lineCap = 'round'; c.lineJoin = 'round'
      c.strokeStyle = pal.hatShade; c.globalAlpha = 0.9; c.lineWidth = 8
      c.beginPath(); smooth(c, outer, false); c.stroke()
      c.strokeStyle = pal.hatHi; c.globalAlpha = 0.55; c.lineWidth = 6
      c.beginPath(); smooth(c, inner.slice(1, -1), false); c.stroke()
      c.strokeStyle = pal.lineHat; c.globalAlpha = 0.35; c.lineWidth = 3
      c.beginPath(); smooth(c, seam, false); c.stroke(); c.globalAlpha = 1
    },
  })
  const P = R.proj(0, 1.52, 1.1)
  R.at(ctx, P, 0, () => ink(ctx, (c) => ellipse(c, 0, 0, 12, 7), { fill: pal.hatShade, line: pal.lineHat, w: 4.5, swell: 0.3 }), Math.max(P.sx, 0.6))
}

function drawHijab(ctx: Ctx, R: Rig): void {
  const { pal } = R
  shadedInk(ctx, hijabBuild(R), {
    base: pal.hat, shade: pal.hatShade, line: pal.lineHat, w: 6.5, off: [-6, -7], rule: 'evenodd',
    form: { mat: 'cloth', k: R.k, spread: 1.15, rim: R.cfg.rimLight * 0.9 },
    hi: (c) => {
      c.lineCap = 'round'; c.strokeStyle = pal.hatHi; c.lineWidth = 8
      strokeSpherePath(c, R, [[-1.2, 0.95], [-0.7, 1.2], [-0.1, 1.3]], 1.1)
      c.strokeStyle = pal.hatShade; c.lineWidth = 4
      strokeSpherePath(c, R, [[0.95, 0.9], [1.35, 0.1], [1.4, -0.7]], 1.08)
      strokeSpherePath(c, R, [[-0.9, -1.0], [-1.3, -0.6]], 1.08)
    },
  })
}

export function drawHeadwearFront(ctx: Ctx, R: Rig): void {
  const hw = R.cfg.headwear
  if (hw === 'hijab') { drawHijab(ctx, R); return }
  if (hw !== 'cap' && hw !== 'beanie') return
  drawDomeBody(ctx, R)
  if (hw === 'beanie') { drawBeanieCuff(ctx, R); drawPomPom(ctx, R) } else drawCapBrim(ctx, R)
}
