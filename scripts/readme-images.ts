/**
 * Renders the pictures the README shows. Transparent backgrounds, so the same
 * files read correctly against GitHub's light and dark themes.
 *
 *   pnpm run images
 */
import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync } from 'node:fs'
import { renderCell, renderSheet, STUDIO_PRESETS } from '../src/studio/index'
import type { Pixels } from '../src/image/types'

type Canvas = ReturnType<typeof createCanvas>
const factory = (w: number, h: number) => createCanvas(w, h) as never

function paste(target: Canvas, image: Pixels, x: number, y: number): void {
  const scratch = createCanvas(image.width, image.height)
  const sctx = scratch.getContext('2d')
  const id = sctx.createImageData(image.width, image.height)
  id.data.set(image.data)
  sctx.putImageData(id, 0, 0)
  target.getContext('2d').drawImage(scratch, x, y)
}

function byId(id: string) {
  const preset = STUDIO_PRESETS.find((p) => p.id === id)
  if (!preset) throw new Error(`no preset ${id}`)
  return preset
}

/** A grid of straight-ahead poses, one per character. */
function grid(ids: readonly string[], columns: number, cell: number, file: string): void {
  const rows = Math.ceil(ids.length / columns)
  const canvas = createCanvas(columns * cell, rows * cell)
  ids.forEach((id, i) => {
    const face = renderCell(byId(id).config, 'directions', 4, { cell, createCanvas: factory })
    paste(canvas, face, (i % columns) * cell, Math.floor(i / columns) * cell)
  })
  writeFileSync(file, canvas.toBuffer('image/png'))
  console.log(`${file}  ${columns * cell}x${rows * cell}`)
}

/** One character's nine head directions, as the README's explanation of the format. */
function sheet(id: string, cell: number, file: string): void {
  const image = renderSheet(byId(id).config, 'directions', { cell, createCanvas: factory })
  const canvas = createCanvas(image.width, image.height)
  paste(canvas, image, 0, 0)
  writeFileSync(file, canvas.toBuffer('image/png'))
  console.log(`${file}  ${image.width}x${image.height}`)
}

/** Nine moods of one character, laid out in a single strip. */
function moods(id: string, cell: number, file: string): void {
  const canvas = createCanvas(cell * 9, cell)
  for (let i = 0; i < 9; i++) {
    const face = renderCell(byId(id).config, 'reactions', i, { cell, createCanvas: factory })
    paste(canvas, face, i * cell, 0)
  }
  writeFileSync(file, canvas.toBuffer('image/png'))
  console.log(`${file}  ${cell * 9}x${cell}`)
}

const tagged = (tag: string) => STUDIO_PRESETS.filter((p) => p.tag === tag).map((p) => p.id)

grid(['fox', 'hacker', 'cat', 'doctor', 'panda', 'footballer', 'bunny', 'chef'], 8, 180, 'docs/images/hero.png')
grid(tagged('animal'), 6, 150, 'docs/images/animals.png')
grid(tagged('profession'), 8, 140, 'docs/images/professions.png')
grid(tagged('sport'), 6, 150, 'docs/images/sports.png')
grid(tagged('person'), 8, 150, 'docs/images/people.png')
sheet('fox', 170, 'docs/images/sheet-directions.png')
moods('bear', 150, 'docs/images/moods.png')
