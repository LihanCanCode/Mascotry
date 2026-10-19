/**
 * A photograph, read as a set of starting points.
 *
 * Pure: a pixel buffer in, a reading out, no DOM and no network. The decoding
 * that produces the buffer lives in ./decode, and it never leaves the tab.
 *
 * The reading is a list of claims with a confidence on each, not a verdict.
 * What cannot be measured honestly is left out and said out loud in `notes` —
 * eye colour needs landmarks this has none of, and the difference between round
 * and square frames is smaller than the noise in a phone snapshot.
 */
import type { Pixels } from '../image/types'
import { assertPixels } from '../image/types'
import { findFace, headBox } from './face'
import { readFacialHair, readGlasses, readShirt } from './features'
import { readHair } from './hair'
import { backdrop, toHex } from './pixels'
import type { PhotoReading, PhotoValues } from './types'

/** How many pixels apart the feature passes sample. Full resolution buys nothing here. */
const STEP = 2
/** A skin region taller than this, relative to its width, is a face with its hair attached. */
const FACE_ASPECT = 1.45

const NO_EYES = 'Eye colour is not read: finding eyes needs facial landmarks this does not have.'
const NO_SHAPE = 'Glasses shape is a guess: only the presence of frames is measured, not their shape.'
const NO_FACE = [
  'No face was found, so nothing was read.',
  'This reads a head-and-shoulders photo best: one face, filling much of the frame, against a plain',
  'background. Warm wood, beige walls and sand are the same colour as skin, and a picture full of them',
  'has nothing to pick a face out of.',
].join(' ')
const CLOSE = 'The hair is close to the skin tone here, so the hair reading is held at low confidence.'

function sampleStep(image: Pixels): number {
  return Math.max(1, Math.min(STEP, Math.floor(Math.min(image.width, image.height) / 64)))
}

type Found = NonNullable<ReturnType<typeof findFace>>

interface Read {
  readonly values: PhotoValues
  /** The hair could not be told apart from the skin, which the notes should admit. */
  readonly ambiguousHair: boolean
}

/** The fields a found face yields. Low-confidence entries are kept, for the panel to show. */
function valuesFor(image: Pixels, found: Found): Read {
  const head = headBox(found.box, image)
  const step = sampleStep(image)
  const back = backdrop(image)
  const merged = found.box.height > found.box.width * FACE_ASPECT
  const hair = readHair(image, { head, skin: found.skin, back, step, merged })
  const facialHair = readFacialHair(image, head, found.skin, step)
  const glasses = readGlasses(image, head, found.skin, step)
  const shirt = readShirt(image, head, found.skin, back, step)
  return {
    ambiguousHair: hair.ambiguous,
    values: {
      // The one inference rather than measurement, and a modest one: what was
      // found is a human-skin face, so the ears are human. It is shown in the
      // readout like everything else, and changed back in one click.
      ears: { value: 'human', confidence: 0.55 },
      skin: { value: toHex(found.skin), confidence: Math.min(1, 0.6 + found.share * 2) },
      hairStyle: { value: hair.style, confidence: hair.styleConfidence },
      ...(hair.colour === null
        ? {}
        : { hairColor: { value: toHex(hair.colour), confidence: hair.colourConfidence } }),
      ...(facialHair === null ? {} : { facialHair }),
      ...(glasses === null ? {} : { glasses }),
      ...(shirt === null ? {} : { shirt }),
    },
  }
}

/** Read a photograph. Never throws for a well-formed buffer, and never guesses. */
export function analysePhoto(image: Pixels): PhotoReading {
  assertPixels(image)
  const found = findFace(image)
  if (found === null) return { face: null, values: {}, notes: [NO_FACE, NO_EYES] }
  const read = valuesFor(image, found)
  const notes = read.ambiguousHair ? [NO_EYES, NO_SHAPE, CLOSE] : [NO_EYES, NO_SHAPE]
  return { face: found.box, values: read.values, notes }
}
