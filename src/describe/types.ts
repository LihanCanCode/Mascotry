/** The shapes the description vocabulary and the parser are written in. */
import type { StudioConfig } from '../studio'

/** The config keys a colour word can be aimed at. */
export type ColourSlot =
  | 'skin' | 'muzzle' | 'earInner' | 'earTip' | 'noseColor' | 'patchColor' | 'hairColor'
  | 'facialHairColor' | 'eyeColor' | 'glassesColor' | 'blushColor' | 'headwearColor'
  | 'neckAccessoryColor' | 'sideAccessoryColor' | 'shirt' | 'accent'

/**
 * One phrase family and what it means.
 *
 * `colourSlot` is the quiet half of the design: a word like "scarf" both sets a
 * part and names somewhere for a nearby colour to land, which is how "a red
 * scarf" works without the table holding a row per colour per garment.
 */
export interface VocabEntry {
  readonly phrases: readonly string[]
  readonly patch?: Partial<StudioConfig>
  readonly colourSlot?: ColourSlot
  /**
   * A second field the same colour fills.
   *
   * One garment, two parts of the drawing: a red hoodie is a red hood and a red
   * top, and colouring only one of them looks like a mistake.
   */
  readonly alsoSlot?: ColourSlot
  /** What "no ..." means, when turning the part off is not simply its `none` value. */
  readonly off?: Partial<StudioConfig>
}

export interface DescribeResult {
  readonly config: StudioConfig
  /** The phrases the parser recognised, in the order they were typed. */
  readonly matched: readonly string[]
  /** The words it could not place, so the UI can admit to them. */
  readonly ignored: readonly string[]
}
