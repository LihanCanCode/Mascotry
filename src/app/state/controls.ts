/**
 * The list of controls the Tune panel renders.
 *
 * Every choice control points at the option array the studio itself exports,
 * by reference. That is the whole trick: when the studio grows a new ear type
 * or hair style, the control picks it up with no edit here, and there is no
 * second copy of the list to go stale.
 */
import {
  EAR_TYPES, EYE_SIZES, FACE_SHAPES, FACIAL_HAIRS, GLASSES, HAIR_STYLES, HEADWEARS,
} from '../../studio'
import type { StudioConfig } from '../../studio'

/** Config keys this app exposes as a colour swatch. */
export type ColourKey = 'skin' | 'hairColor' | 'eyeColor' | 'shirt' | 'accent'

export interface ColourControl {
  readonly key: ColourKey
  readonly label: string
  /** Shown under the label when the colour means something different per character. */
  readonly hint?: string
}

export const COLOUR_CONTROLS: readonly ColourControl[] = Object.freeze([
  { key: 'skin', label: 'Skin or fur', hint: 'The head and the ears' },
  { key: 'hairColor', label: 'Hair' },
  { key: 'eyeColor', label: 'Eyes' },
  { key: 'shirt', label: 'Shirt' },
  { key: 'accent', label: 'Accents', hint: 'Trim, badges and scarf' },
])

/** Config keys whose value must be one of a finite set the studio publishes. */
export type ChoiceKey = 'faceShape' | 'ears' | 'hairStyle' | 'facialHair' | 'glasses' | 'headwear' | 'eyeSize'

export type ChoiceControl = {
  readonly [K in ChoiceKey]: {
    readonly key: K
    readonly label: string
    readonly options: readonly StudioConfig[K][]
  }
}[ChoiceKey]

export const CHOICE_CONTROLS: readonly ChoiceControl[] = Object.freeze([
  { key: 'faceShape', label: 'Face shape', options: FACE_SHAPES },
  { key: 'ears', label: 'Ears', options: EAR_TYPES },
  { key: 'hairStyle', label: 'Hair style', options: HAIR_STYLES },
  { key: 'facialHair', label: 'Facial hair', options: FACIAL_HAIRS },
  { key: 'glasses', label: 'Glasses', options: GLASSES },
  { key: 'headwear', label: 'Headwear', options: HEADWEARS },
  { key: 'eyeSize', label: 'Eye size', options: EYE_SIZES },
])

export type ToggleKey = 'blush'

export interface ToggleControl {
  readonly key: ToggleKey
  readonly label: string
}

export const TOGGLE_CONTROLS: readonly ToggleControl[] = Object.freeze([
  { key: 'blush', label: 'Blushed cheeks' },
])

/** Option names that read oddly on their own once capitalised. */
const SPELLED_OUT: Readonly<Record<string, string>> = {
  bolt: 'Bolt antennae',
  buzz: 'Buzz cut',
  bun: 'Top bun',
  bob: 'Bob cut',
  o: 'Open mouth',
}

/** A human label for one option value. */
export function optionLabel(value: string): string {
  const spelled = SPELLED_OUT[value]
  if (spelled !== undefined) return spelled
  if (value.length === 0) return ''
  return value[0]?.toUpperCase() + value.slice(1)
}

/**
 * A one-key config patch straight from a DOM control.
 *
 * The cast is deliberate and it is the only one: a `<select>` and an
 * `<input type="color">` both hand back a plain string, and the single place
 * that decides whether a string is a legal config value is `normaliseConfig`,
 * which the reducer runs on every patch and which reports what it rejected.
 * Narrowing here as well would just be a second, weaker copy of that rule.
 */
export function patch(key: keyof StudioConfig, value: string | boolean): Partial<StudioConfig> {
  return { [key]: value } as Partial<StudioConfig>
}
