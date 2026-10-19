/**
 * Visual QA: render contact sheets, group galleries and zooms into `out/` (gitignored).
 * Run through `pnpm run shots [outDir]`. Not part of the library or the test suite.
 *
 * `SHOT_IDS=hood,hacker` limits the per-character sheets to those ids; `SHOT_TAGS=profession`
 * limits the group galleries. Both default to everything.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas, ImageData } from '@napi-rs/canvas'
import type { Canvas } from '@napi-rs/canvas'
import { STUDIO_PRESETS } from '../src/studio/presets'
import type { PresetTag } from '../src/studio/presets'
import { renderSheet, renderCell } from '../src/studio/render'
import type { CanvasLike, SheetKind, StudioConfig } from '../src/studio/types'

const factory = (w: number, h: number): CanvasLike => createCanvas(w, h) as unknown as CanvasLike
const OUT = process.argv[2] ?? 'out/after'
const LIGHT = '#f4f0ea'
const DARK = '#20222c'
const TAGS: readonly PresetTag[] = ['animal', 'person', 'profession', 'sport', 'object']

const list = (name: string): readonly string[] | null => {
  const raw = process.env[name]
  return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : null
}

function save(name: string, canvas: Canvas): void {
  writeFileSync(`${OUT}/${name}.png`, canvas.toBuffer('image/png'))
}

/** Paint a RawImage onto a fresh canvas over a flat plate so alpha is visible. */
function plate(data: Uint8ClampedArray, w: number, h: number, bg: string): Canvas {
  const c: Canvas = createCanvas(w, h)
  const ctx = c.getContext('2d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  const tmp: Canvas = createCanvas(w, h)
  tmp.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0)
  ctx.drawImage(tmp, 0, 0)
  return c
}

function sheetShot(id: string, cfg: StudioConfig, kind: SheetKind, cell: number): void {
  const img = renderSheet(cfg, kind, { cell, createCanvas: factory })
  save(`${id}-${kind}-${cell}`, plate(img.data, img.width, img.height, LIGHT))
}

/** One cell blown up with nearest-neighbour so brush decisions are legible. */
function zoom(id: string, cfg: StudioConfig, index: number, cell: number, scale: number): void {
  const img = renderCell(cfg, 'directions', index, { cell, createCanvas: factory })
  const src = plate(img.data, cell, cell, LIGHT)
  const c: Canvas = createCanvas(cell * scale, cell * scale)
  const ctx = c.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(src, 0, 0, cell * scale, cell * scale)
  save(`${id}-zoom${cell}x${scale}`, c)
}

/** A grid of forward-facing cells, so weak characters stand out against strong ones. */
function contact(name: string, ids: readonly StudioConfig[], cell: number, bg: string, cols: number): void {
  if (!ids.length) return
  const rows = Math.ceil(ids.length / cols)
  const c: Canvas = createCanvas(cols * cell, rows * cell)
  const ctx = c.getContext('2d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, cols * cell, rows * cell)
  ids.forEach((cfg, i) => {
    const img = renderCell(cfg, 'directions', 4, { cell, createCanvas: factory })
    ctx.drawImage(plate(img.data, cell, cell, bg), (i % cols) * cell, Math.floor(i / cols) * cell)
  })
  save(name, c)
}

function groupSheets(): void {
  const want = list('SHOT_TAGS')
  for (const tag of TAGS) {
    if (want && !want.includes(tag)) continue
    const cfgs = STUDIO_PRESETS.filter((p) => p.tag === tag).map((p) => p.config)
    contact(`group-${tag}-128`, cfgs, 128, LIGHT, 6)
    contact(`group-${tag}-512`, cfgs, 512, LIGHT, 4)
  }
}

function characterSheets(): void {
  const want = list('SHOT_IDS')
  for (const preset of STUDIO_PRESETS) {
    if (want && !want.includes(preset.id)) continue
    sheetShot(preset.id, preset.config, 'directions', 128)
    sheetShot(preset.id, preset.config, 'directions', 512)
    zoom(preset.id, preset.config, 4, 128, 4)
    zoom(preset.id, preset.config, 4, 512, 1)
  }
}

/** Mean cost of one 512 sheet, over the slowest and a plain character. */
function timings(): void {
  const pick = (id: string): StudioConfig =>
    (STUDIO_PRESETS.find((p) => p.id === id) ?? STUDIO_PRESETS[0]!).config
  const mean = (cfg: StudioConfig): number => {
    const t0 = performance.now()
    for (let i = 0; i < 5; i++) renderSheet(cfg, 'directions', { cell: 512, createCanvas: factory })
    return (performance.now() - t0) / 5
  }
  const rows = ['fox', 'curly', 'hacker'].map((id) => `${id} ${mean(pick(id)).toFixed(1)}ms`)
  process.stdout.write(`512 sheet: ${rows.join(', ')}\n`)
}

mkdirSync(OUT, { recursive: true })
characterSheets()
groupSheets()
contact('gallery-128', STUDIO_PRESETS.map((p) => p.config), 128, LIGHT, 10)
contact('gallery-256', STUDIO_PRESETS.map((p) => p.config), 256, DARK, 10)
timings()
