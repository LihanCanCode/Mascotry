// Body: neck, torso, neckline, shirt detail. Takes no pose, so it is identical in all cells.
import { ellipse, ink, roundRect, starPath } from '../draw'
import { occlude, rgba, rimLight, shadedInk } from '../shade'
import type { Build, Ctx, Material, Palette, StudioConfig } from '../types'

/** Rows at/below this (512 design space) are never touched by head parts: the "body identity" band. */
export const BODY_TOP = 372

const torso: Build = (c) => {
  c.moveTo(228, 352); c.bezierCurveTo(206, 360, 176, 362, 168, 390)
  c.lineTo(164, 428); c.quadraticCurveTo(164, 441, 177, 441); c.lineTo(335, 441)
  c.quadraticCurveTo(348, 441, 348, 428); c.lineTo(344, 390)
  c.bezierCurveTo(336, 362, 306, 360, 284, 352); c.closePath()
}

function drawShirtHighlights(c: Ctx, pal: Palette, cfg: StudioConfig): void {
  c.save(); c.beginPath(); torso(c); c.clip()
  c.strokeStyle = pal.shirtHi; c.lineWidth = 8; c.lineCap = 'round'
  c.beginPath(); c.moveTo(184, 400); c.quadraticCurveTo(186, 380, 206, 372); c.stroke()
  if (cfg.shirtDetail === 'stripe') {
    c.fillStyle = pal.accent; c.fillRect(150, 398, 220, 13); c.fillRect(150, 420, 220, 13)
    c.fillStyle = pal.accentShade; c.fillRect(150, 409, 220, 3); c.fillRect(150, 431, 220, 3)
  }
  c.restore()
}

function drawBadge(ctx: Ctx, pal: Palette): void {
  ctx.save(); ctx.translate(310, 404)
  ink(ctx, (c) => ellipse(c, 0, 0, 17, 17), { fill: pal.accent, line: pal.lineAccent, w: 4.5, swell: 0.3 })
  ink(ctx, (c) => starPath(c, 10, 0.48), { fill: '#fff', line: pal.lineAccent, w: 2.5, swell: 0 })
  ctx.restore()
}

type Poly = readonly (readonly [number, number])[]
const tri = (pts: Poly): Build => (c) => {
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
  c.closePath()
}

const neckShape: Build = (c) => roundRect(c, 231, 312, 50, 64, 12)

/**
 * The chin sits in front of the neck, so the neck darkens under it. This is what stops the head
 * reading as a sticker laid on a separate torso. It lives in the body layer because the body must
 * stay pose-free, which is also why the chin is approximated rather than taken from the rig.
 */
function drawChinShadow(ctx: Ctx, pal: Palette, k: number): void {
  if (k <= 0) return
  ctx.save(); ctx.beginPath(); neckShape(ctx); ctx.clip()
  occlude(ctx, (c) => ellipse(c, 256, 298, 74, 48), { color: pal.skinDeep, alpha: 0.9 * k, dx: 0, dy: 28, steps: 5 })
  ctx.restore()
}

/** The neck casts into the shirt, which is most of what reads as "collar" at thumbnail size. */
function drawCollarShadow(ctx: Ctx, pal: Palette, k: number): void {
  if (k <= 0) return
  ctx.save(); ctx.beginPath(); torso(ctx); ctx.clip()
  occlude(ctx, neckShape, { color: pal.shirtShade, alpha: 0.75 * k, dx: 2, dy: 18, steps: 4 })
  ctx.restore()
}

function drawNeckline(ctx: Ctx, pal: Palette, cfg: StudioConfig): void {
  const line = pal.lineShirt
  const hole = (path: Build): void => {
    ink(ctx, path, { fill: pal.skinShade, line, w: 5, swell: 0.3 })
    if (cfg.shading <= 0) return
    // Inside the opening the light only reaches the bottom: the chin blocks the rest.
    const k = Math.min(1, cfg.shading)
    const g = ctx.createLinearGradient(0, 340, 0, 402)
    g.addColorStop(0, rgba(pal.skinDeep, 0.85 * k))
    g.addColorStop(0.7, rgba(pal.skinDeep, 0.18 * k))
    g.addColorStop(1, rgba(pal.skinDeep, 0))
    ctx.fillStyle = g
    ctx.beginPath(); path(ctx); ctx.fill()
    ink(ctx, path, { line, w: 5, swell: 0.3 })
  }
  switch (cfg.neckline) {
    case 'v':
      hole(tri([[225, 351], [256, 400], [287, 351]])); break
    case 'boat':
      hole((c) => { c.moveTo(203, 356); c.quadraticCurveTo(256, 388, 309, 356); c.lineTo(309, 350); c.lineTo(203, 350); c.closePath() }); break
    case 'turtle':
      ink(ctx, (c) => roundRect(c, 220, 332, 72, 44, 15), { fill: pal.shirt, line, w: 6, swell: 0.4 })
      ctx.strokeStyle = pal.shirtShade; ctx.lineWidth = 4; ctx.lineCap = 'round'
      ctx.beginPath()
      for (const x of [238, 256, 274]) { ctx.moveTo(x, 340); ctx.lineTo(x, 370) }
      ctx.stroke(); break
    case 'collar':
      hole(tri([[225, 351], [256, 394], [287, 351]]))
      ink(ctx, tri([[222, 350], [256, 400], [232, 376]]), { fill: '#fffdf8', line, w: 5, swell: 0.3 })
      ink(ctx, tri([[290, 350], [256, 400], [280, 376]]), { fill: '#eee8f2', line, w: 5, swell: 0.3 })
      break
    case 'scarf':
      hole((c) => { c.moveTo(224, 352); c.quadraticCurveTo(256, 394, 288, 352); c.closePath() })
      ink(ctx, tri([[270, 372], [300, 366], [312, 428], [282, 436]]), { fill: pal.accentShade, line, w: 6 })
      ink(ctx, (c) => { c.moveTo(208, 356); c.quadraticCurveTo(256, 400, 304, 356); c.lineTo(310, 378); c.quadraticCurveTo(256, 420, 202, 378); c.closePath() }, { fill: pal.accent, line, w: 6 })
      break
    default: // crew
      hole((c) => { c.moveTo(224, 351); c.quadraticCurveTo(256, 392, 288, 351); c.closePath() })
  }
}

/** Hijab cape draped over the shoulders: part of the static body so the layer stays pose-free. */
function drawHijabDrape(ctx: Ctx, pal: Palette, k: number): void {
  const cape: Build = (c) => {
    c.moveTo(196, 346); c.quadraticCurveTo(256, 330, 316, 346)
    c.bezierCurveTo(338, 356, 348, 380, 346, 410)
    c.quadraticCurveTo(256, 436, 166, 410)
    c.bezierCurveTo(164, 380, 174, 356, 196, 346); c.closePath()
  }
  shadedInk(ctx, cape, {
    base: pal.hat, shade: pal.hatShade, line: pal.lineHat, w: 6.5, off: [-8, -6],
    form: { mat: 'cloth', k, spread: 1.2, rim: 0.6 },
    hi: (c) => {
      c.strokeStyle = pal.hatHi; c.lineWidth = 7; c.lineCap = 'round'
      c.beginPath(); c.moveTo(186, 392); c.quadraticCurveTo(190, 372, 208, 362); c.stroke()
      c.strokeStyle = pal.hatShade; c.lineWidth = 4
      c.beginPath(); c.moveTo(256, 380); c.quadraticCurveTo(250, 400, 258, 422); c.stroke()
      c.beginPath(); c.moveTo(300, 372); c.quadraticCurveTo(310, 392, 306, 410); c.stroke()
    },
  })
}

export function drawBody(ctx: Ctx, pal: Palette, cfg: StudioConfig, mat: Material): void {
  ink(ctx, neckShape, { fill: pal.skinShade, line: pal.lineSkin, w: 6, swell: 0.4 })
  drawChinShadow(ctx, pal, cfg.shading)
  shadedInk(ctx, torso, {
    base: pal.shirt, shade: pal.shirtShade, line: pal.lineShirt, w: 7, off: [-9, -4],
    form: { mat: mat === 'metal' ? 'metal' : 'cloth', k: cfg.shading, spread: 1.15, rim: cfg.rimLight },
    hi: (c) => drawShirtHighlights(c, pal, cfg),
  })
  drawCollarShadow(ctx, pal, cfg.shading)
  if (cfg.shirtDetail === 'badge') drawBadge(ctx, pal)
  if (cfg.headwear === 'hijab') drawHijabDrape(ctx, pal, cfg.shading)
  else drawNeckline(ctx, pal, cfg)
}
