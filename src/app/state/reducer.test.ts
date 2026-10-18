import { STUDIO_PRESETS } from '../../studio'
import { MAX_NAME, PREVIEW_MAX, PREVIEW_MIN, initialState, reduce, type AppState, type SheetPair } from './reducer'

const sheets = (): SheetPair => ({
  directions: new Blob(['d'], { type: 'image/webp' }),
  reactions: new Blob(['r'], { type: 'image/webp' }),
  mime: 'image/webp',
})

const second = STUDIO_PRESETS[1]?.id ?? 'bear'

describe('initialState', () => {
  it('starts on the first preset with its drawing not yet rendered', () => {
    expect(initialState.presetId).toBe(STUDIO_PRESETS[0]?.id)
    expect(initialState.config).toBe(STUDIO_PRESETS[0]?.config)
    expect(initialState.phase).toBe('idle')
    expect(initialState.sheets).toBeNull()
    expect(initialState.error).toBeNull()
  })

  it('names the mascot after the preset it started from', () => {
    expect(initialState.name).toBe(STUDIO_PRESETS[0]?.name)
  })
})

describe('reduce: picking a preset', () => {
  it('adopts the preset config and name, and asks for a new drawing', () => {
    const next = reduce(initialState, { type: 'pickPreset', id: second })
    expect(next.presetId).toBe(second)
    expect(next.config).toBe(STUDIO_PRESETS[1]?.config)
    expect(next.name).toBe(STUDIO_PRESETS[1]?.name)
    expect(next.revision).toBe(initialState.revision + 1)
  })

  it('ignores an id that is not a preset', () => {
    expect(reduce(initialState, { type: 'pickPreset', id: 'nobody' })).toBe(initialState)
  })

  it('keeps a name the person typed themselves', () => {
    const named = reduce(initialState, { type: 'setName', name: 'Bramble' })
    expect(reduce(named, { type: 'pickPreset', id: second }).name).toBe('Bramble')
  })
})

describe('reduce: tuning the config', () => {
  it('merges a patch and asks for a new drawing', () => {
    const next = reduce(initialState, { type: 'setConfig', patch: { ears: 'bunny' } })
    expect(next.config.ears).toBe('bunny')
    expect(next.config.skin).toBe(initialState.config.skin)
    expect(next.revision).toBe(initialState.revision + 1)
  })

  it('leaves the preset id alone, because a tuned preset is still that preset', () => {
    const next = reduce(initialState, { type: 'setConfig', patch: { blush: false } })
    expect(next.presetId).toBe(initialState.presetId)
  })

  it('never mutates the state it was given', () => {
    const before = JSON.stringify(initialState.config)
    reduce(initialState, { type: 'setConfig', patch: { skin: '#123456' } })
    expect(JSON.stringify(initialState.config)).toBe(before)
  })

  it('reports a patch the studio refuses and keeps the drawing it had', () => {
    const next = reduce(initialState, { type: 'setConfig', patch: { skin: 'not a colour' } as never })
    expect(next.config).toBe(initialState.config)
    expect(next.phase).toBe('failed')
    expect(next.error).toMatch(/skin/)
    expect(next.revision).toBe(initialState.revision)
  })
})

describe('reduce: naming', () => {
  it('keeps the name within a length a file name and an attribute can carry', () => {
    const next = reduce(initialState, { type: 'setName', name: 'x'.repeat(500) })
    expect(next.name.length).toBe(MAX_NAME)
  })

  it('does not ask for a new drawing, because the name is not drawn', () => {
    const next = reduce(initialState, { type: 'setName', name: 'Pip' })
    expect(next.revision).toBe(initialState.revision)
  })

  it('accepts an empty name without falling back to anything', () => {
    expect(reduce(initialState, { type: 'setName', name: '' }).name).toBe('')
  })
})

describe('reduce: preview settings', () => {
  it('clamps the preview size into the range the slider offers', () => {
    expect(reduce(initialState, { type: 'setPreviewSize', size: 10 }).previewSize).toBe(PREVIEW_MIN)
    expect(reduce(initialState, { type: 'setPreviewSize', size: 9000 }).previewSize).toBe(PREVIEW_MAX)
    expect(reduce(initialState, { type: 'setPreviewSize', size: 150 }).previewSize).toBe(150)
  })

  it('rounds a fractional size, since it becomes a pixel count', () => {
    expect(reduce(initialState, { type: 'setPreviewSize', size: 150.7 }).previewSize).toBe(151)
  })

  it('falls back to the size it had when handed something that is not a number', () => {
    expect(reduce(initialState, { type: 'setPreviewSize', size: Number.NaN }).previewSize)
      .toBe(initialState.previewSize)
  })

  it('changes the backdrop without asking for a new drawing', () => {
    const next = reduce(initialState, { type: 'setBackdrop', backdrop: 'checker' })
    expect(next.backdrop).toBe('checker')
    expect(next.revision).toBe(initialState.revision)
  })

  it('asks for a new drawing when the export resolution changes', () => {
    const next = reduce(initialState, { type: 'setResolution', resolution: 256 })
    expect(next.resolution).toBe(256)
    expect(next.revision).toBe(initialState.revision + 1)
  })

  it('does nothing when the resolution is already the one asked for', () => {
    expect(reduce(initialState, { type: 'setResolution', resolution: initialState.resolution }))
      .toBe(initialState)
  })
})

describe('reduce: the render round trip', () => {
  const started: AppState = reduce(initialState, { type: 'renderStarted' })

  it('goes busy and clears the last error when a render starts', () => {
    const failed = reduce(initialState, { type: 'renderFailed', revision: 0, message: 'boom' })
    const retry = reduce(failed, { type: 'renderStarted' })
    expect(retry.phase).toBe('rendering')
    expect(retry.error).toBeNull()
  })

  it('keeps the previous sheets on screen while the next ones render', () => {
    const ready = reduce(started, { type: 'renderFinished', revision: 0, sheets: sheets() })
    const again = reduce(ready, { type: 'renderStarted' })
    expect(again.sheets).toBe(ready.sheets)
  })

  it('stores the sheets and goes ready', () => {
    const pair = sheets()
    const next = reduce(started, { type: 'renderFinished', revision: 0, sheets: pair })
    expect(next.sheets).toBe(pair)
    expect(next.phase).toBe('ready')
    expect(next.error).toBeNull()
  })

  /**
   * Cancellation lives here rather than in the worker: a render is tagged with
   * the revision it was started for, and anything that comes back for an older
   * revision is dropped. That makes a cancelled render a pure-function concern.
   */
  it('drops a result that belongs to a drawing the person has already changed', () => {
    const moved = reduce(started, { type: 'setConfig', patch: { ears: 'cat' } })
    const stale = reduce(moved, { type: 'renderFinished', revision: 0, sheets: sheets() })
    expect(stale).toBe(moved)
    expect(stale.sheets).toBeNull()
  })

  it('drops a failure that belongs to a superseded drawing', () => {
    const moved = reduce(started, { type: 'setConfig', patch: { ears: 'cat' } })
    const stale = reduce(moved, { type: 'renderFailed', revision: 0, message: 'boom' })
    expect(stale).toBe(moved)
    expect(stale.error).toBeNull()
  })

  it('records a failure for the current drawing', () => {
    const next = reduce(started, { type: 'renderFailed', revision: 0, message: 'no canvas' })
    expect(next.phase).toBe('failed')
    expect(next.error).toBe('no canvas')
  })
})

describe('reduce: unknown actions', () => {
  it('returns the same state object, so React does not re-render', () => {
    expect(reduce(initialState, { type: 'nope' } as never)).toBe(initialState)
  })
})
