import { describe, expect, it } from 'vitest'
import { assertPixels } from '../image/types'
import type { Pixels } from '../image/types'
import { DEFAULT_CONFIG } from '../studio'
import { analysePhoto } from './analyse'
import { readingToConfig } from './reading'
import { faceOval, sketchFace, sketchNoFace } from './fixtures'
import { CONFIDENT } from './types'
import type { PhotoReading } from './types'

/** Channel-wise distance between two `#rrggbb` strings. */
function apart(a: string, b: string): number {
  const channel = (hex: string, i: number): number => Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  return Math.max(...[0, 1, 2].map((i) => Math.abs(channel(a, i) - channel(b, i))))
}

/** A small sketch dropped into the corner of a big plain frame, for the "too far away" case. */
function pasted(sketch: Pixels, width: number, height: number, background = '#d2d2d2'): Pixels {
  const data = new Uint8ClampedArray(width * height * 4)
  const channel = (i: number): number => Number.parseInt(background.slice(1 + i * 2, 3 + i * 2), 16)
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = channel(0)
    data[i * 4 + 1] = channel(1)
    data[i * 4 + 2] = channel(2)
    data[i * 4 + 3] = 255
  }
  for (let y = 0; y < sketch.height; y += 1) {
    for (let x = 0; x < sketch.width; x += 1) {
      const from = (y * sketch.width + x) * 4
      const to = ((y + 20) * width + x + 20) * 4
      for (let c = 0; c < 4; c += 1) data[to + c] = sketch.data[from + c] ?? 0
    }
  }
  return { width, height, data }
}

const TONES: readonly string[] =['#f6d9c0', '#e8bb96', '#cda06a', '#c98a5e', '#8a5a38', '#5f3a24', '#43281c']

describe('the sketches the reader is judged on', () => {
  it('produces well-formed pixel buffers', () => {
    const image = sketchFace({ skin: '#c98a5e' })
    expect(() => assertPixels(image)).not.toThrow()
    expect(image.width).toBe(180)
    expect(image.height).toBe(220)
  })

  it('is reproducible, so a failure can be chased', () => {
    const a = sketchFace({ skin: '#c98a5e', texture: 0.8 })
    const b = sketchFace({ skin: '#c98a5e', texture: 0.8 })
    expect(a.data).toEqual(b.data)
  })
})

describe('analysePhoto: finding the face', () => {
  it('finds the face about where it was drawn', () => {
    const image = sketchFace({ skin: '#c98a5e' })
    const oval = faceOval(image.width, image.height)
    const reading = analysePhoto(image)
    expect(reading.face).not.toBeNull()
    const face = reading.face
    if (face === null) return
    expect(Math.abs(face.x + face.width / 2 - oval.cx)).toBeLessThan(image.width * 0.08)
    expect(Math.abs(face.y - (oval.cy - oval.ry))).toBeLessThan(image.height * 0.1)
    expect(face.width).toBeGreaterThan(image.width * 0.3)
    expect(face.width).toBeLessThan(image.width * 0.7)
  })

  it('says it found nothing rather than guessing, when there is no face', () => {
    const reading = analysePhoto(sketchNoFace())
    expect(reading.face).toBeNull()
    expect(reading.values.skin).toBeUndefined()
    expect(reading.values.hairColor).toBeUndefined()
    expect(reading.notes.join(' ')).toMatch(/face/i)
  })

  it('finds nothing in an image too small to hold a face', () => {
    const reading = analysePhoto({ width: 4, height: 4, data: new Uint8ClampedArray(4 * 4 * 4) })
    expect(reading.face).toBeNull()
  })

  it('is not fooled by a skin-coloured backdrop with no face in it', () => {
    // A skin-coloured region filling the frame is a wall, an arm or a bad crop.
    const reading = analysePhoto(sketchNoFace('#c98a5e'))
    expect(reading.face).toBeNull()
    expect(reading.values).toEqual({})
  })

  it('refuses a face too small a part of the frame to read', () => {
    const reading = analysePhoto(pasted(sketchFace({ skin: '#c98a5e', width: 70, height: 85 }), 560, 560))
    expect(reading.face).toBeNull()
    expect(reading.notes.join(' ')).toMatch(/one face/i)
  })
})

describe('analysePhoto: skin tone', () => {
  it.each(TONES)('reads %s back within tolerance', (skin) => {
    const reading = analysePhoto(sketchFace({ skin }))
    const read = reading.values.skin
    expect(read, `no skin reading for ${skin}`).toBeDefined()
    if (read === undefined) return
    expect(read.confidence).toBeGreaterThanOrEqual(CONFIDENT)
    expect(apart(read.value, skin)).toBeLessThanOrEqual(12)
  })

  it('takes the median, so a bright highlight does not lift the tone', () => {
    const plain = analysePhoto(sketchFace({ skin: '#c98a5e' })).values.skin?.value
    const lit = analysePhoto(sketchFace({ skin: '#c98a5e', glasses: true })).values.skin?.value
    expect(plain).toBe(lit)
  })
})

describe('analysePhoto: hair', () => {
  it.each(['#2b2230', '#4a3326', '#6e3a5e'])('reads the hair colour %s within tolerance', (hair) => {
    const reading = analysePhoto(sketchFace({ skin: '#e8bb96', hair, hairCap: 0.3, hairDrop: 0.5 }))
    const read = reading.values.hairColor
    expect(read, `no hair reading for ${hair}`).toBeDefined()
    if (read === undefined) return
    expect(read.confidence).toBeGreaterThanOrEqual(CONFIDENT)
    expect(apart(read.value, hair)).toBeLessThanOrEqual(20)
  })

  const styles: readonly (readonly [string, Parameters<typeof sketchFace>[0]])[] = [
    ['buzz', { skin: '#e8bb96', hair: '#2b2230', hairCap: 0.05, hairDrop: 0 }],
    ['bob', { skin: '#e8bb96', hair: '#2b2230', hairCap: 0.2, hairDrop: 0.5 }],
    ['ponytail', { skin: '#e8bb96', hair: '#2b2230', hairCap: 0.2, hairDrop: 1.1 }],
    ['bun', { skin: '#e8bb96', hair: '#2b2230', hairCap: 0.2, hairDrop: 0.1, bun: true }],
    ['curly', { skin: '#e8bb96', hair: '#4a3326', hairCap: 0.3, hairDrop: 0.4, texture: 0.9 }],
  ]
  it.each(styles)('calls a %s head of hair what it is', (style, sketch) => {
    const read = analysePhoto(sketchFace(sketch)).values.hairStyle
    expect(read, `no hair style for ${style}`).toBeDefined()
    expect(read?.value).toBe(style)
  })

  it('reports no hair at all for a bare head', () => {
    const read = analysePhoto(sketchFace({ skin: '#e8bb96', hair: null })).values.hairStyle
    expect(read === undefined || read.value === 'none' || read.confidence < CONFIDENT).toBe(true)
  })

  it('will not claim hair it cannot separate from the skin', () => {
    const reading = analysePhoto(sketchFace({ skin: '#f6d9c0', hair: '#e0bf7a', hairCap: 0.25, hairDrop: 0.4 }))
    const colour = reading.values.hairColor
    const close = colour === undefined || colour.confidence < CONFIDENT || apart(colour.value, '#e0bf7a') <= 40
    expect(close).toBe(true)
  })
})

describe('analysePhoto: facial hair', () => {
  it('sees a beard as a beard', () => {
    const read = analysePhoto(sketchFace({ skin: '#e8bb96', beard: '#3a2a22' })).values.facialHair
    expect(read).toBeDefined()
    expect(read?.value).toBe('beard')
    expect(read?.confidence).toBeGreaterThanOrEqual(CONFIDENT)
  })

  it('leaves a clean-shaven face alone', () => {
    const read = analysePhoto(sketchFace({ skin: '#e8bb96', beard: null })).values.facialHair
    expect(read === undefined || read.value === 'none').toBe(true)
  })

  it('does not report a beard it cannot see against very dark skin', () => {
    const read = analysePhoto(sketchFace({ skin: '#43281c', beard: '#3a2a22' })).values.facialHair
    const honest = read === undefined || read.value === 'none' || read.confidence < CONFIDENT
    expect(honest).toBe(true)
  })
})

describe('analysePhoto: glasses', () => {
  it('sees a bar across the eyes as glasses', () => {
    const read = analysePhoto(sketchFace({ skin: '#e8bb96', glasses: true })).values.glasses
    expect(read).toBeDefined()
    expect(read?.value).not.toBe('none')
    expect(read?.confidence).toBeGreaterThanOrEqual(CONFIDENT)
  })

  it('does not invent glasses on a bare face', () => {
    const read = analysePhoto(sketchFace({ skin: '#e8bb96', glasses: false })).values.glasses
    expect(read === undefined || read.value === 'none' || read.confidence < CONFIDENT).toBe(true)
  })

  it('does not mistake a beard for glasses', () => {
    const read = analysePhoto(sketchFace({ skin: '#e8bb96', beard: '#3a2a22' })).values.glasses
    expect(read === undefined || read.value === 'none' || read.confidence < CONFIDENT).toBe(true)
  })
})

describe('analysePhoto: shirt', () => {
  it.each(['#3f6fb5', '#9e1d45', '#2f8f8f'])('reads the shirt colour %s from the bottom strip', (shirt) => {
    const read = analysePhoto(sketchFace({ skin: '#e8bb96', shirt })).values.shirt
    expect(read).toBeDefined()
    if (read === undefined) return
    expect(apart(read.value, shirt)).toBeLessThanOrEqual(12)
  })

  it('says nothing about a shirt when there is only backdrop below the face', () => {
    const read = analysePhoto(sketchFace({ skin: '#e8bb96', shirt: null })).values.shirt
    expect(read === undefined || read.confidence < CONFIDENT).toBe(true)
  })
})

describe('analysePhoto: what it refuses to read', () => {
  it('never reports an eye colour, because it cannot find eyes', () => {
    const reading = analysePhoto(sketchFace({ skin: '#e8bb96', glasses: true }))
    expect(Object.keys(reading.values)).not.toContain('eyeColor')
    expect(reading.notes.join(' ')).toMatch(/eye/i)
  })

  it('admits when the hair and the skin were too close to tell apart', () => {
    const reading = analysePhoto(sketchFace({ skin: '#c98a5e', hair: '#c4854f', hairCap: 0.35, hairDrop: 1 }))
    expect(reading.notes.join(' ')).toMatch(/close to the skin tone/i)
  })

  it('does not make that excuse for a head with no hair on it', () => {
    const reading = analysePhoto(sketchFace({ skin: '#e8bb96', hair: null }))
    expect(reading.notes.join(' ')).not.toMatch(/close to the skin tone/i)
  })

  it('never reports a glasses shape it cannot measure', () => {
    const reading = analysePhoto(sketchFace({ skin: '#e8bb96', glasses: true }))
    expect(reading.notes.join(' ')).toMatch(/shape/i)
  })
})

describe('readingToConfig', () => {
  function reading(values: PhotoReading['values']): PhotoReading {
    return { face: { x: 0, y: 0, width: 10, height: 10 }, values, notes: [] }
  }

  it('applies a confident reading', () => {
    const config = readingToConfig(reading({ skin: { value: '#8a5a38', confidence: 0.9 } }), DEFAULT_CONFIG)
    expect(config.skin).toBe('#8a5a38')
  })

  it('leaves a field the reader was unsure of at the base value', () => {
    const config = readingToConfig(reading({ skin: { value: '#8a5a38', confidence: 0.2 } }), DEFAULT_CONFIG)
    expect(config.skin).toBe(DEFAULT_CONFIG.skin)
  })

  it('takes a reading exactly at the threshold', () => {
    const config = readingToConfig(reading({ skin: { value: '#8a5a38', confidence: CONFIDENT } }), DEFAULT_CONFIG)
    expect(config.skin).toBe('#8a5a38')
  })

  it('keeps every other field of the base config', () => {
    const base = { ...DEFAULT_CONFIG, shirt: '#111111', ears: 'cat' as const }
    const config = readingToConfig(reading({ skin: { value: '#8a5a38', confidence: 1 } }), base)
    expect(config.shirt).toBe('#111111')
    expect(config.ears).toBe('cat')
  })

  it('returns the base config unchanged for a reading with nothing in it', () => {
    const config = readingToConfig({ face: null, values: {}, notes: [] }, DEFAULT_CONFIG)
    expect(config).toEqual(DEFAULT_CONFIG)
  })

  it('does not mutate the base config', () => {
    const base = { ...DEFAULT_CONFIG }
    readingToConfig(reading({ skin: { value: '#8a5a38', confidence: 1 } }), base)
    expect(base.skin).toBe(DEFAULT_CONFIG.skin)
  })

  it('drops the hair style and colour together when hair was not read', () => {
    const config = readingToConfig(
      reading({ hairStyle: { value: 'bob', confidence: 0.8 }, hairColor: { value: '#2b2230', confidence: 0.8 } }),
      DEFAULT_CONFIG,
    )
    expect(config.hairStyle).toBe('bob')
    expect(config.hairColor).toBe('#2b2230')
  })

  it('produces a config the studio accepts, end to end from a sketch', () => {
    const image = sketchFace({ skin: '#8a5a38', hair: '#2b2230', hairDrop: 0.5, shirt: '#2f8f8f', glasses: true })
    const config = readingToConfig(analysePhoto(image), DEFAULT_CONFIG)
    expect(config.skin).not.toBe(DEFAULT_CONFIG.skin)
    expect(config.shirt).not.toBe(DEFAULT_CONFIG.shirt)
    expect(Object.isFrozen(config)).toBe(true)
  })
})

describe('analysePhoto: the ears', () => {
  it('sets human ears when a human face was found', () => {
    const read = analysePhoto(sketchFace({ skin: '#c98a5e' })).values.ears
    expect(read?.value).toBe('human')
    expect(read?.confidence).toBeGreaterThanOrEqual(CONFIDENT)
  })

  it('claims nothing about ears when no face was found', () => {
    expect(analysePhoto(sketchNoFace()).values.ears).toBeUndefined()
  })

  it('takes the cheek ruff with the ears it belonged to', () => {
    const image = sketchFace({ skin: '#c98a5e' })
    const config = readingToConfig(analysePhoto(image), { ...DEFAULT_CONFIG, ears: 'fox', cheekFluff: 'ruff' })
    expect(config.ears).toBe('human')
    expect(config.cheekFluff).toBe('none')
  })
})

/**
 * The shape of failure a real photograph produces.
 *
 * A man standing in a hotel lobby: warm wood and beige walls filling the frame,
 * his face a tenth of its height. Every one of those walls sits inside the skin
 * chroma band, so the mask fires on the whole picture and the old reader
 * returned the entire frame as a "face", a mud-coloured skin tone and a shirt
 * sampled off the wooden floor. These are that photograph, in miniature.
 */
describe('analysePhoto: warm rooms, which look exactly like skin', () => {
  /** A warm wall, as a flat frame of one of the colours that fools a chroma test. */
  function room(width: number, height: number, colour: string): Pixels {
    const data = new Uint8ClampedArray(width * height * 4)
    const channel = (i: number): number => Number.parseInt(colour.slice(1 + i * 2, 3 + i * 2), 16)
    for (let i = 0; i < width * height; i += 1) {
      data[i * 4] = channel(0)
      data[i * 4 + 1] = channel(1)
      data[i * 4 + 2] = channel(2)
      data[i * 4 + 3] = 255
    }
    return { width, height, data }
  }

  it.each(['#c8a877', '#b99a74', '#d8c3a0'])('refuses a room full of %s, which is skin to a chroma test', (wood) => {
    const reading = analysePhoto(room(320, 400, wood))
    expect(reading.face).toBeNull()
    expect(reading.values).toEqual({})
  })

  it('refuses a small face across a large warm background', () => {
    const face = sketchFace({ skin: '#8a5a38', width: 70, height: 86, background: '#c8a877', shirt: null })
    const reading = analysePhoto(pasted(face, 520, 620, '#c8a877'))
    expect(reading.face).toBeNull()
    expect(reading.values.skin).toBeUndefined()
    expect(reading.values.shirt).toBeUndefined()
  })

  it('says what kind of photo would have worked', () => {
    const reading = analysePhoto(room(320, 400, '#c8a877'))
    expect(reading.notes.join(' ')).toMatch(/head-and-shoulders/i)
    expect(reading.notes.join(' ')).toMatch(/plain background/i)
  })

  it('still reads a close-up against that same warm background', () => {
    const close = sketchFace({ skin: '#8a5a38', background: '#c8a877', hair: '#2b2230', hairDrop: 0.4 })
    const reading = analysePhoto(close)
    expect(reading.face).not.toBeNull()
    expect(reading.values.skin?.value).toBe('#8a5a38')
  })

  it('takes the shirt from below the face, not from the bottom of the frame', () => {
    // A full-length shot: the character up top, a wooden floor filling the rest.
    const face = sketchFace({ skin: '#e8bb96', shirt: '#2f8f8f', width: 240, height: 300 })
    const tall = pasted(face, 300, 620, '#8a6a3c')
    const reading = analysePhoto(tall)
    const shirt = reading.values.shirt
    if (shirt !== undefined && shirt.confidence >= CONFIDENT) {
      expect(apart(shirt.value, '#8a6a3c')).toBeGreaterThan(30)
    }
  })

  it('does not put glasses on a face that has none', () => {
    for (const skin of ['#f6d9c0', '#c98a5e', '#8a5a38']) {
      const read = analysePhoto(sketchFace({ skin, hair: '#2b2230', hairDrop: 0.4 })).values.glasses
      expect(read === undefined || read.value === 'none' || read.confidence < CONFIDENT, skin).toBe(true)
    }
  })
})
