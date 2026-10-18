/**
 * The entry point for the React runtime file the app offers for download.
 *
 * It exists so that one bundle can be produced from the same sources the app
 * itself previews with — the component plus the aim and poke modules — leaving
 * React to be resolved by whoever drops the file into their project.
 */
export { Mascot } from './Mascot'
export type { MascotProps } from './Mascot'
export { DEFAULT_AIM } from './aim'
export type { AimSettings } from './aim'
export { MOODS } from './poke'
export type { Mood } from './poke'
