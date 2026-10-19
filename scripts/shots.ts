/**
 * Visual QA: render contact sheets and zooms for every preset into `out/` (gitignored).
 * Run through `pnpm run shots`. Not part of the library or the test suite.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { createCanvas, ImageData } from '@napi-rs/canvas'
import type { Canvas } from '@napi-rs/canvas'
import { STUDIO_PRESETS } from '../src/studio/presets'
import { renderSheet, renderCell } from '../src/studio/render'
import type { CanvasLike, SheetKind, StudioConfig } from '../src/studio/types'

const factory = (w: number, h: number): CanvasLike => createCanvas(w, h) as unknown as CanvasLike
const OUT = process.argv[2] ?? 'out/after'
const IDS = ['fox', 'bear', 'cat', 'panda', 'robot', 'sam', 'mei', 'zara', 'noor', 'otto', 'bunny', 'amina', 'leo', 'jonas']

function save(name: string, canvas: Canvas): void {
  writeFileSync(`${OUT}/${name}.png`, canvas.toBuffer('image/png'))
}

/** Paint a RawImage onto a fresh canvas over a light checker so alpha is visible. */
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

function sheetShot(id: string, cfg: StudioConfig, kind: SheetKind, cell: number, bg: string): void {
  const img = renderSheet(cfg, kind, { cell, createCanvas: factory })
  save(`${id}-${kind}-${cell}`, plate(img.data, img.width, img.height, bg))
}

/** One cell blown up with nearest-neighbour so brush decisions are legible. */
function zoom(id: string, cfg: StudioConfig, index: number, cell: number, scale: number): void {
  const img = renderCell(cfg, 'directions', index, { cell, createCanvas: factory })
  const src = plate(img.data, cell, cell, '#f4f0ea')
  const c: Canvas = createCanvas(cell * scale, cell * scale)
  const ctx = c.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(src, 0, 0, cell * scale, cell * scale)
  save(`${id}-zoom${cell}x${scale}`, c)
}

/** All presets side by side at gallery size, so weak ones stand out against strong ones. */
function gallery(cell: number, bg: string): void {
  const cols = 7
  const rows = Math.ceil(STUDIO_PRESETS.length / cols)
  const c: Canvas = createCanvas(cols * cell, rows * cell)
  const ctx = c.getContext('2d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, cols * cell, rows * cell)
  STUDIO_PRESETS.forEach((p, i) => {
    const img = renderCell(p.config, 'directions', 4, { cell, createCanvas: factory })
    ctx.drawImage(plate(img.data, cell, cell, bg), (i % cols) * cell, Math.floor(i / cols) * cell)
  })
  save(`gallery-${cell}`, c)
}

mkdirSync(OUT, { recursive: true })
for (const id of IDS) {
  const preset = STUDIO_PRESETS.find((p) => p.id === id)
  if (!preset) continue
  sheetShot(id, preset.config, 'directions', 128, '#f4f0ea')
  sheetShot(id, preset.config, 'reactions', 128, '#f4f0ea')
  sheetShot(id, preset.config, 'directions', 512, '#f4f0ea')
  zoom(id, preset.config, 4, 128, 4)
  zoom(id, preset.config, 4, 512, 1)
}
gallery(128, '#f4f0ea')
gallery(256, '#20222c')

const t0 = performance.now()
for (let i = 0; i < 5; i++) renderSheet(STUDIO_PRESETS[0]!.config, 'directions', { cell: 512, createCanvas: factory })
const fox = (performance.now() - t0) / 5
const t1 = performance.now()
for (let i = 0; i < 5; i++) renderSheet(STUDIO_PRESETS[8]!.config, 'directions', { cell: 512, createCanvas: factory })
const zara = (performance.now() - t1) / 5
process.stdout.write(`512 sheet: fox ${fox.toFixed(1)}ms, zara(curly) ${zara.toFixed(1)}ms\n`)
