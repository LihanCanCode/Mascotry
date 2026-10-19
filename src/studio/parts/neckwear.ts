/**
 * Neck accessories, worn over the collar. They belong to the body layer, which takes no pose, so
 * everything here is authored in fixed design-space coordinates and is identical in all 18 cells
 * by construction. Nothing here may reach below the torso or outside its shoulders.
 */
import { ellipse, hiOf, ink, inkOf, roundRect, shadeOf, starPath } from '../draw'
import { shadedInk } from '../shade'
import type { Build, Ctx, Palette, StudioConfig } from '../types'

/** The three tones and the line a neck accessory is painted with. */
interface Kit {
  readonly base: string
  readonly shade: string
  readonly hi: string
  readonly line: string
}

const kitOf = (cfg: StudioConfig): Kit => ({
  base: cfg.neckAccessoryColor,
  shade: shadeOf(cfg.neckAccessoryColor),
  hi: hiOf(cfg.neckAccessoryColor),
  line: inkOf(cfg.neckAccessoryColor, cfg.outline, cfg.lineTint),
})

/** Every accessory is cloth or metal sitting flat on the chest, so they share one light spec. */
const paint = (ctx: Ctx, build: Build, kit: Kit, k: number, w = 6, spread = 1.3): void => {
  shadedInk(ctx, build, {
    base: kit.base, shade: kit.shade, line: kit.line, w, off: [-5, -5],
    form: { mat: 'cloth', k, spread, rim: 0.5 },
  })
}

const cord = (ctx: Ctx, kit: Kit, build: Build, w: number): void => {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = kit.line; ctx.lineWidth = w + 5
  ctx.beginPath(); build(ctx); ctx.stroke()
  ctx.strokeStyle = kit.base; ctx.lineWidth = w
  ctx.beginPath(); build(ctx); ctx.stroke()
  ctx.strokeStyle = kit.hi; ctx.lineWidth = w * 0.3
  ctx.beginPath(); build(ctx); ctx.stroke()
}

/** Tubing round the neck, down the chest and into a chest piece sitting off to one side. */
function drawStethoscope(ctx: Ctx, kit: Kit, pal: Palette, k: number): void {
  cord(ctx, kit, (c) => {
    c.moveTo(224, 336); c.bezierCurveTo(202, 370, 196, 404, 204, 436)
    c.moveTo(288, 336); c.bezierCurveTo(312, 370, 320, 398, 304, 418)
  }, 9)
  ink(ctx, (c) => ellipse(c, 300, 426, 15, 15), { fill: kit.shade, line: kit.line, w: 5, swell: 0.3 })
  shadedInk(ctx, (c) => ellipse(c, 298, 424, 22, 22), {
    base: pal.accent, shade: pal.accentShade, line: pal.lineAccent, w: 5,
    form: { mat: 'metal', k, spread: 1.5, rim: 0.8 },
  })
  ink(ctx, (c) => ellipse(c, 298, 424, 11, 11), { fill: kit.shade, line: kit.line, w: 3.5, swell: 0 })
}

/** A bib with two straps over the shoulders and a pocket seam across the middle. */
function drawApron(ctx: Ctx, kit: Kit, k: number): void {
  cord(ctx, kit, (c) => {
    c.moveTo(230, 336); c.quadraticCurveTo(220, 360, 216, 382)
    c.moveTo(282, 336); c.quadraticCurveTo(292, 360, 296, 382)
  }, 11)
  paint(ctx, (c) => roundRect(c, 202, 372, 108, 69, 12), kit, k, 6.5, 1.2)
  ctx.save(); ctx.beginPath(); roundRect(ctx, 202, 372, 108, 69, 12); ctx.clip()
  ctx.strokeStyle = kit.shade; ctx.lineWidth = 5; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(208, 408); ctx.lineTo(304, 408); ctx.moveTo(256, 408); ctx.lineTo(256, 441)
  ctx.stroke(); ctx.restore()
}

/** Knot at the throat, blade widening down the chest. */
function drawTie(ctx: Ctx, kit: Kit, k: number): void {
  paint(ctx, (c) => {
    c.moveTo(256, 364); c.lineTo(272, 390); c.quadraticCurveTo(278, 420, 262, 438)
    c.quadraticCurveTo(256, 441, 250, 438); c.quadraticCurveTo(234, 420, 240, 390); c.closePath()
  }, kit, k, 6, 1.5)
  paint(ctx, (c) => roundRect(c, 240, 340, 32, 28, 7), kit, k, 6, 1.8)
}

/** Two cords meeting at a plain card: the badge every office character wears. */
function drawLanyard(ctx: Ctx, kit: Kit, pal: Palette, k: number): void {
  cord(ctx, kit, (c) => {
    c.moveTo(228, 336); c.quadraticCurveTo(238, 380, 256, 396)
    c.moveTo(284, 336); c.quadraticCurveTo(274, 380, 256, 396)
  }, 8)
  paint(ctx, (c) => roundRect(c, 232, 394, 48, 40, 6), { ...kit, base: '#f6f4ef', shade: '#cfc9c0', hi: '#ffffff' }, k, 5, 1.4)
  ctx.fillStyle = pal.accentShade
  ctx.fillRect(239, 402, 34, 6); ctx.fillRect(239, 414, 24, 5); ctx.fillRect(239, 424, 30, 5)
}

/** A wrap round the throat with one tail hanging over the shoulder. */
function drawScarf(ctx: Ctx, kit: Kit, k: number): void {
  paint(ctx, (c) => {
    c.moveTo(214, 352); c.quadraticCurveTo(256, 382, 298, 352)
    c.quadraticCurveTo(310, 368, 304, 388); c.quadraticCurveTo(256, 414, 208, 388)
    c.quadraticCurveTo(202, 368, 214, 352); c.closePath()
  }, kit, k, 6.5, 1.2)
  paint(ctx, (c) => {
    c.moveTo(276, 392); c.lineTo(306, 386); c.lineTo(316, 436)
    c.quadraticCurveTo(300, 441, 284, 438); c.closePath()
  }, kit, k, 6, 1.6)
}

/** A ribbon V into a struck disc: the sport characters' prize. */
function drawMedal(ctx: Ctx, kit: Kit, pal: Palette, k: number): void {
  paint(ctx, (c) => {
    c.moveTo(228, 336); c.lineTo(248, 338); c.lineTo(264, 402); c.lineTo(248, 406); c.closePath()
    c.moveTo(284, 336); c.lineTo(264, 338); c.lineTo(248, 402); c.lineTo(264, 406); c.closePath()
  }, kit, k, 5.5, 1.6)
  shadedInk(ctx, (c) => ellipse(c, 256, 418, 23, 23), {
    base: pal.accent, shade: pal.accentShade, line: pal.lineAccent, w: 5.5,
    form: { mat: 'metal', k, spread: 1.5, rim: 0.9 },
  })
  ctx.save(); ctx.translate(256, 418)
  ink(ctx, (c) => starPath(c, 12, 0.48), { fill: pal.accentShade, line: pal.lineAccent, w: 2.5, swell: 0 })
  ctx.restore()
}

/** Draw the neck accessory on the body layer, over whatever neckline is already there. */
export function drawNeckAccessory(ctx: Ctx, pal: Palette, cfg: StudioConfig): void {
  const na = cfg.neckAccessory
  if (na === 'none') return
  const kit = kitOf(cfg)
  const k = cfg.shading
  if (na === 'stethoscope') drawStethoscope(ctx, kit, pal, k)
  else if (na === 'apron') drawApron(ctx, kit, k)
  else if (na === 'tie') drawTie(ctx, kit, k)
  else if (na === 'lanyard') drawLanyard(ctx, kit, pal, k)
  else if (na === 'scarf') drawScarf(ctx, kit, k)
  else drawMedal(ctx, kit, pal, k)
}
