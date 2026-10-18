import {
  EAR_TYPES, EYE_SIZES, FACE_SHAPES, FACIAL_HAIRS, GLASSES, HAIR_STYLES, HEADWEARS, DEFAULT_CONFIG,
} from '../../studio'
import { CHOICE_CONTROLS, COLOUR_CONTROLS, TOGGLE_CONTROLS, optionLabel } from './controls'

describe('COLOUR_CONTROLS', () => {
  it('names a key that really exists on a config', () => {
    for (const control of COLOUR_CONTROLS) {
      expect(DEFAULT_CONFIG).toHaveProperty(control.key)
    }
  })

  it('points at a value that is already a #rrggbb colour', () => {
    for (const control of COLOUR_CONTROLS) {
      expect(DEFAULT_CONFIG[control.key]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('covers skin, hair, eyes, shirt and accents', () => {
    expect(COLOUR_CONTROLS.map((c) => c.key)).toEqual(['skin', 'hairColor', 'eyeColor', 'shirt', 'accent'])
  })

  it('labels every control distinctly', () => {
    const labels = COLOUR_CONTROLS.map((c) => c.label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})

describe('CHOICE_CONTROLS', () => {
  /**
   * The point of this test: the option lists must be the very arrays the studio
   * exports, not copies. A copy would quietly go stale the moment the studio
   * grows a new ear type.
   */
  it('reuses the studio option arrays by reference, so the list cannot drift', () => {
    const byKey = new Map(CHOICE_CONTROLS.map((c) => [c.key, c.options]))
    expect(byKey.get('faceShape')).toBe(FACE_SHAPES)
    expect(byKey.get('ears')).toBe(EAR_TYPES)
    expect(byKey.get('hairStyle')).toBe(HAIR_STYLES)
    expect(byKey.get('facialHair')).toBe(FACIAL_HAIRS)
    expect(byKey.get('glasses')).toBe(GLASSES)
    expect(byKey.get('headwear')).toBe(HEADWEARS)
    expect(byKey.get('eyeSize')).toBe(EYE_SIZES)
  })

  it('covers every part the brief asks to be tunable', () => {
    expect(CHOICE_CONTROLS.map((c) => c.key).sort()).toEqual(
      ['ears', 'eyeSize', 'faceShape', 'facialHair', 'glasses', 'hairStyle', 'headwear'],
    )
  })

  it('offers at least two options per control', () => {
    for (const control of CHOICE_CONTROLS) {
      expect(control.options.length, control.key).toBeGreaterThanOrEqual(2)
    }
  })

  it('includes the default value among the options it offers', () => {
    for (const control of CHOICE_CONTROLS) {
      expect(control.options as readonly string[], control.key).toContain(DEFAULT_CONFIG[control.key])
    }
  })

  it('labels every control distinctly', () => {
    const labels = CHOICE_CONTROLS.map((c) => c.label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})

describe('TOGGLE_CONTROLS', () => {
  it('covers blush and points at a boolean', () => {
    expect(TOGGLE_CONTROLS.map((c) => c.key)).toEqual(['blush'])
    expect(typeof DEFAULT_CONFIG.blush).toBe('boolean')
  })
})

describe('optionLabel', () => {
  it('capitalises a plain option name', () => {
    expect(optionLabel('round')).toBe('Round')
    expect(optionLabel('none')).toBe('None')
  })

  it('spells out names that read badly capitalised on their own', () => {
    expect(optionLabel('bolt')).toBe('Bolt antennae')
    expect(optionLabel('buzz')).toBe('Buzz cut')
  })

  it('leaves an unknown value readable rather than blank', () => {
    expect(optionLabel('wobble')).toBe('Wobble')
    expect(optionLabel('')).toBe('')
  })
})
