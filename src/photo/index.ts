/**
 * "From a photo": a character that shares the colouring and features of a
 * photograph, read in this tab and never uploaded. See ./analyse for what is
 * measured and ./decode for how the file is handled.
 */
export { analysePhoto } from './analyse'
export { readingToConfig, confidentPatch } from './reading'
export { readPhoto, sniffImageType, fitWithin, fileComplaint, MAX_BYTES, MAX_EDGE } from './decode'
export { CONFIDENT, PHOTO_FIELD_LABELS } from './types'
export type { FaceBox, PhotoField, PhotoReading, PhotoValues, Reading } from './types'
