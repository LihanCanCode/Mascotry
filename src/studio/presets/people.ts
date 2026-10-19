/**
 * Eight neutral faces. They are the doorway into the studio rather than finished characters, so
 * they are listed by look and the set deliberately spans skin tone, face shape, hair type, eye
 * size and brow weight: someone should be able to find a near miss and change three things.
 */
import { make } from './preset'
import type { StudioPreset } from './preset'

const p = make('person')

export const PEOPLE: readonly StudioPreset[] = Object.freeze([
  p('curly', 'Curly', {
    faceShape: 'round', skin: '#8a5a3c', hairStyle: 'curly', hairColor: '#241a22', eyeColor: '#3a2418',
    eyeSize: 'large', lashes: 'long', brows: 'soft', blushColor: '#d9667a', shirt: '#e8a23a', neckline: 'v',
    accent: '#fff3d6',
  }),
  p('bun', 'Bun', {
    faceShape: 'heart', skin: '#f5d0b0', hairStyle: 'bun', hairColor: '#7a3b2a', glasses: 'round',
    glassesColor: '#2b1d33', eyeColor: '#2f6f8f', lashes: 'soft', brows: 'arched', shirt: '#e9d58a',
    neckline: 'collar', accent: '#e8688a',
  }),
  p('buzz', 'Buzz', {
    faceShape: 'square', skin: '#e8b894', hairStyle: 'buzz', hairColor: '#5a4636', facialHair: 'stubble',
    glasses: 'square', glassesColor: '#3d3d55', eyeColor: '#4a6a8a', eyeSize: 'small', brows: 'bold',
    shirt: '#c05a3a', neckline: 'collar', accent: '#ffe0a8',
  }),
  p('bob', 'Bob', {
    faceShape: 'round', skin: '#5e3b2a', hairStyle: 'bob', hairColor: '#1d1520', headwear: 'beanie',
    headwearColor: '#d9453f', accent: '#fff0d0', eyeColor: '#3a2418', glasses: 'square', glassesColor: '#e8a23a',
    eyeSize: 'large', lashes: 'soft', shirt: '#6a4fb8', neckline: 'turtle', blushColor: '#e07088',
  }),
  p('ponytail', 'Ponytail', {
    faceShape: 'oval', skin: '#f1c4a0', hairStyle: 'ponytail', hairColor: '#b5522e', eyeColor: '#5a7aa0',
    eyeSize: 'small', lids: 'heavy', brows: 'thin', shirt: '#2f7f86', neckline: 'crew', accent: '#ffcf4a',
  }),
  p('beard', 'Beard', {
    faceShape: 'square', skin: '#d29a6c', hairStyle: 'messy', hairColor: '#17131c', facialHair: 'beard',
    eyeColor: '#3b2a22', eyeSize: 'small', brows: 'bold', shirt: '#25252d', neckline: 'crew', accent: '#e8505b',
  }),
  p('hijab', 'Hijab', {
    faceShape: 'oval', skin: '#d9a47a', hairStyle: 'none', headwear: 'hijab', headwearColor: '#3f8f9a',
    hairColor: '#2b2230', eyeColor: '#4a2f22', eyeSize: 'large', lashes: 'long', brows: 'arched', shirt: '#f1e6d3',
    accent: '#f3c969',
  }),
  p('headscarf', 'Headscarf', {
    faceShape: 'round', skin: '#6f4733', hairStyle: 'none', headwear: 'hijab', headwearColor: '#c8603f',
    hairColor: '#20181f', eyeColor: '#2e1d16', eyeSize: 'medium', lashes: 'soft', brows: 'bold', lids: 'heavy',
    shirt: '#36584a', neckline: 'boat', accent: '#f0d9a8', blushColor: '#c05f6a',
  }),
])
