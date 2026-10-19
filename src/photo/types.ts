/** What a photograph can be read as, and how sure the reader is of each part. */
import type { StudioConfig } from '../studio'

export interface FaceBox {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface Reading<T> {
  readonly value: T
  /** 0 to 1. Anything under `CONFIDENT` is shown but not applied. */
  readonly confidence: number
}

/** The config keys a photograph can speak to. Eye colour is deliberately not one. */
export type PhotoField = 'ears' | 'skin' | 'hairColor' | 'hairStyle' | 'facialHair' | 'glasses' | 'shirt'

export type PhotoValues = {
  readonly [K in PhotoField]?: Reading<StudioConfig[K]>
}

export interface PhotoReading {
  /** Where the face was found, in pixels of the buffer that was read. Null means it was not. */
  readonly face: FaceBox | null
  readonly values: PhotoValues
  /** Plain sentences about what the reader would not claim, for the panel to show. */
  readonly notes: readonly string[]
}

/** The confidence at which a reading is applied to the config rather than merely reported. */
export const CONFIDENT = 0.5

export const PHOTO_FIELD_LABELS: Readonly<Record<PhotoField, string>> = {
  ears: 'Ears',
  skin: 'Skin or fur',
  hairColor: 'Hair colour',
  hairStyle: 'Hair style',
  facialHair: 'Facial hair',
  glasses: 'Glasses',
  shirt: 'Shirt',
}
