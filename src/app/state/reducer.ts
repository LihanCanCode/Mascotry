/**
 * All of the app's state in one pure reducer.
 *
 * Two ideas shape it. First, anything that changes the drawing bumps `revision`,
 * and anything that only changes how the drawing is displayed does not — so an
 * effect watching `revision` renders exactly as often as it has to. Second, a
 * finished render carries the revision it was started for, and a result for an
 * older revision is dropped. That makes cancellation a property of this pure
 * function rather than something the worker has to get right.
 */
import { STUDIO_PRESETS, normaliseConfig } from '../../studio'
import type { StudioConfig } from '../../studio'
import { describeToConfig } from '../../describe'
import { readingToConfig } from '../../photo'
import type { PhotoReading } from '../../photo'

export type Backdrop = 'light' | 'dark' | 'checker'
/** The three ways a character can be started. All three end in the same Tune panel. */
export type Door = 'pick' | 'describe' | 'photo'
export type Phase = 'idle' | 'rendering' | 'ready' | 'failed'
export type SheetMime = 'image/webp' | 'image/png'

export const RESOLUTIONS = [256, 360, 512] as const
export type Resolution = (typeof RESOLUTIONS)[number]

export const PREVIEW_MIN = 64
export const PREVIEW_MAX = 320
export const MAX_NAME = 48
/** What a character made at the describe or photo door is called until it is renamed. */
export const DRAWN_NAME = 'Mascot'

export interface SheetPair {
  readonly directions: Blob
  readonly reactions: Blob
  /** What the browser actually gave us, which decides the download extension. */
  readonly mime: SheetMime
}

/** What the Describe panel says it understood, kept so the line survives a door switch. */
export interface DescribeNote {
  readonly matched: readonly string[]
  readonly ignored: readonly string[]
}

export interface AppState {
  readonly door: Door
  /** Empty once the character came from a description or a photo instead of a card. */
  readonly presetId: string
  /** What the person calls it; used for the label and the file names. */
  readonly name: string
  readonly config: StudioConfig
  readonly previewSize: number
  readonly backdrop: Backdrop
  readonly resolution: Resolution
  readonly phase: Phase
  readonly sheets: SheetPair | null
  readonly error: string | null
  readonly revision: number
  /** What was typed in the Describe panel, and what the parser made of it. */
  readonly describeText: string
  readonly describeNote: DescribeNote | null
  /** The last photograph reading, which the Photo panel shows field by field. */
  readonly reading: PhotoReading | null
}

export type AppAction =
  | { readonly type: 'setDoor'; readonly door: Door }
  | { readonly type: 'describe'; readonly text: string }
  | { readonly type: 'readPhoto'; readonly reading: PhotoReading }
  | { readonly type: 'pickPreset'; readonly id: string }
  | { readonly type: 'setName'; readonly name: string }
  | { readonly type: 'setConfig'; readonly patch: Partial<StudioConfig> }
  | { readonly type: 'setPreviewSize'; readonly size: number }
  | { readonly type: 'setBackdrop'; readonly backdrop: Backdrop }
  | { readonly type: 'setResolution'; readonly resolution: Resolution }
  | { readonly type: 'renderStarted' }
  | { readonly type: 'renderFinished'; readonly revision: number; readonly sheets: SheetPair }
  | { readonly type: 'renderFailed'; readonly revision: number; readonly message: string }

const FIRST = STUDIO_PRESETS[0]
if (FIRST === undefined) throw new Error('the studio ships no presets')

export const initialState: AppState = Object.freeze({
  door: 'pick',
  presetId: FIRST.id,
  name: FIRST.name,
  config: FIRST.config,
  previewSize: 160,
  backdrop: 'checker',
  resolution: 360,
  phase: 'idle',
  sheets: null,
  error: null,
  revision: 0,
  describeText: '',
  describeNote: null,
  reading: null,
})

function clampPreview(size: number, fallback: number): number {
  if (!Number.isFinite(size)) return fallback
  return Math.min(Math.max(Math.round(size), PREVIEW_MIN), PREVIEW_MAX)
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'The studio could not use that value.'
}

/** A config change, validated by the studio before it reaches the state. */
function withConfig(state: AppState, patch: Partial<StudioConfig>): AppState {
  try {
    return {
      ...state,
      config: normaliseConfig({ ...state.config, ...patch }),
      revision: state.revision + 1,
      phase: 'rendering',
      error: null,
    }
  } catch (error: unknown) {
    return { ...state, phase: 'failed', error: message(error) }
  }
}

function withPreset(state: AppState, id: string): AppState {
  const preset = STUDIO_PRESETS.find((candidate) => candidate.id === id)
  if (preset === undefined) return state
  const renamed = state.name === presetName(state.presetId) ? preset.name : state.name
  return {
    ...state,
    presetId: preset.id,
    name: renamed,
    config: preset.config,
    revision: state.revision + 1,
    phase: 'rendering',
    error: null,
  }
}

function presetName(id: string): string | undefined {
  return STUDIO_PRESETS.find((candidate) => candidate.id === id)?.name
}

/** True when two configs would draw the same character, so a redraw can be skipped. */
function sameConfig(a: StudioConfig, b: StudioConfig): boolean {
  return (Object.keys(a) as readonly (keyof StudioConfig)[]).every((key) => a[key] === b[key])
}

/**
 * A character the studio should draw next, from whichever door it arrived by.
 *
 * One function for both new doors, because the question is the same in both:
 * the config may well be the one already on screen — every keystroke in the
 * description produces a config, and most of them produce the same one — and
 * re-rendering eighteen poses to arrive where we already are is the one thing
 * live typing cannot afford.
 */
function withArrival(state: AppState, config: StudioConfig, extra: Partial<AppState>): AppState {
  // A name the visitor chose is theirs; one left over from a card they are no
  // longer using would otherwise follow them into the file names.
  const named = state.name === presetName(state.presetId) ? DRAWN_NAME : state.name
  if (sameConfig(config, state.config)) return { ...state, ...extra, presetId: '', name: named }
  return {
    ...state,
    ...extra,
    presetId: '',
    name: named,
    config,
    revision: state.revision + 1,
    phase: 'rendering',
    error: null,
  }
}

function withDescription(state: AppState, text: string): AppState {
  const result = describeToConfig(text)
  const note: DescribeNote = { matched: result.matched, ignored: result.ignored }
  const extra = { describeText: text, describeNote: note }
  // An empty box is not a request for the default character; it is a request
  // for nothing, so whatever is on screen stays there.
  if (text.trim().length === 0) return { ...state, describeText: text, describeNote: null }
  return withArrival(state, result.config, extra)
}

function withReading(state: AppState, reading: PhotoReading): AppState {
  try {
    return withArrival(state, readingToConfig(reading, state.config), { reading })
  } catch (error: unknown) {
    return { ...state, reading, phase: 'failed', error: message(error) }
  }
}

export function reduce(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'setDoor':
      return action.door === state.door ? state : { ...state, door: action.door }
    case 'describe':
      return withDescription(state, action.text)
    case 'readPhoto':
      return withReading(state, action.reading)
    case 'pickPreset':
      return withPreset(state, action.id)
    case 'setName':
      return { ...state, name: action.name.slice(0, MAX_NAME) }
    case 'setConfig':
      return withConfig(state, action.patch)
    case 'setPreviewSize':
      return { ...state, previewSize: clampPreview(action.size, state.previewSize) }
    case 'setBackdrop':
      return { ...state, backdrop: action.backdrop }
    case 'setResolution':
      return action.resolution === state.resolution
        ? state
        : { ...state, resolution: action.resolution, revision: state.revision + 1, phase: 'rendering', error: null }
    case 'renderStarted':
      return { ...state, phase: 'rendering', error: null }
    case 'renderFinished':
      if (action.revision !== state.revision) return state
      return { ...state, sheets: action.sheets, phase: 'ready', error: null }
    case 'renderFailed':
      if (action.revision !== state.revision) return state
      return { ...state, phase: 'failed', error: action.message }
    default:
      return state
  }
}
