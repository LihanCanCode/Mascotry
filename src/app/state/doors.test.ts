/** The reducer's half of the two new doors: a description, and a photograph reading. */
import { DEFAULT_CONFIG } from '../../studio'
import { analysePhoto } from '../../photo'
import type { PhotoReading } from '../../photo'
import { sketchFace, sketchNoFace } from '../../photo/fixtures'
import { initialState, reduce } from './reducer'
import type { AppState } from './reducer'

const ready: AppState = { ...initialState, phase: 'ready' }

describe('reduce: the doors', () => {
  it('starts on the pick door', () => {
    expect(initialState.door).toBe('pick')
    expect(initialState.describeText).toBe('')
    expect(initialState.describeNote).toBeNull()
    expect(initialState.reading).toBeNull()
  })

  it('switches door without redrawing anything', () => {
    const next = reduce(ready, { type: 'setDoor', door: 'describe' })
    expect(next.door).toBe('describe')
    expect(next.revision).toBe(ready.revision)
    expect(next.config).toBe(ready.config)
  })

  it('returns the same state when the door is already open', () => {
    expect(reduce(ready, { type: 'setDoor', door: 'pick' })).toBe(ready)
  })
})

describe('reduce: describing a character', () => {
  it('reads the description into the config and asks for a drawing', () => {
    const next = reduce(ready, { type: 'describe', text: 'a grey cat in a red scarf' })
    expect(next.config.ears).toBe('cat')
    expect(next.config.neckAccessory).toBe('scarf')
    expect(next.revision).toBe(ready.revision + 1)
    expect(next.phase).toBe('rendering')
  })

  it('keeps what it read and what it skipped, for the panel to show', () => {
    const next = reduce(ready, { type: 'describe', text: 'beanie and a llama' })
    expect(next.describeText).toBe('beanie and a llama')
    expect(next.describeNote?.matched).toContain('beanie')
    expect(next.describeNote?.ignored).toContain('llama')
  })

  it('clears the preset, because the character no longer came from a card', () => {
    const next = reduce(ready, { type: 'describe', text: 'bald' })
    expect(next.presetId).toBe('')
  })

  it('does not redraw when the next keystroke means the same character', () => {
    const once = reduce(ready, { type: 'describe', text: 'round glasses' })
    const again = reduce(once, { type: 'describe', text: 'round glasses!' })
    expect(again.revision).toBe(once.revision)
    expect(again.describeText).toBe('round glasses!')
  })

  it('leaves the character alone when the box is emptied', () => {
    const typed = reduce(ready, { type: 'describe', text: 'a cat' })
    const cleared = reduce(typed, { type: 'describe', text: '' })
    expect(cleared.config).toBe(typed.config)
    expect(cleared.revision).toBe(typed.revision)
    expect(cleared.describeNote).toBeNull()
    expect(cleared.describeText).toBe('')
  })

  it('can be finished by hand, like any other door', () => {
    const described = reduce(ready, { type: 'describe', text: 'a cat' })
    const tuned = reduce(described, { type: 'setConfig', patch: { headwear: 'beret' } })
    expect(tuned.config.ears).toBe('cat')
    expect(tuned.config.headwear).toBe('beret')
  })
})

describe('reduce: reading a photograph', () => {
  const reading = analysePhoto(sketchFace({ skin: '#8a5a38', hair: '#2b2230', hairDrop: 0.5, shirt: '#2f8f8f' }))

  it('applies the confident fields and asks for a drawing', () => {
    const next = reduce(ready, { type: 'readPhoto', reading })
    expect(next.config.skin).not.toBe(ready.config.skin)
    expect(next.revision).toBe(ready.revision + 1)
    expect(next.reading).toBe(reading)
    expect(next.presetId).toBe('')
  })

  it('keeps the reading even when it found nothing, so the panel can say so', () => {
    const empty = analysePhoto(sketchNoFace())
    const next = reduce(ready, { type: 'readPhoto', reading: empty })
    expect(next.reading).toBe(empty)
    expect(next.config).toBe(ready.config)
    expect(next.revision).toBe(ready.revision)
  })

  it('reports a reading the studio will not accept instead of throwing', () => {
    const broken: PhotoReading = {
      face: { x: 0, y: 0, width: 1, height: 1 },
      values: { skin: { value: 'not a colour', confidence: 1 } },
      notes: [],
    }
    const next = reduce(ready, { type: 'readPhoto', reading: broken })
    expect(next.phase).toBe('failed')
    expect(next.error).toMatch(/skin/)
    expect(next.config).toBe(ready.config)
  })

  it('leaves the fields it was unsure about at the values already set', () => {
    const base = { ...ready, config: DEFAULT_CONFIG }
    const next = reduce(base, { type: 'readPhoto', reading: analysePhoto(sketchNoFace('#5a6472')) })
    expect(next.config.hairStyle).toBe(DEFAULT_CONFIG.hairStyle)
  })
})
