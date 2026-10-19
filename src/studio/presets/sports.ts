/**
 * Pick your game. Roles, never real players: the shirts take invented colours and carry no crest,
 * because a club kit is a trademark and a recognisable likeness is somebody's own. Like the
 * professions these vary skin, hair and features across the set rather than defaulting to one.
 */
import { make } from './preset'
import type { StudioPreset } from './preset'

const s = make('sport')

export const SPORTS: readonly StudioPreset[] = Object.freeze([
  s('footballer', 'Footballer', {
    faceShape: 'oval', skin: '#8a5a3c', hairStyle: 'buzz', hairColor: '#1d1520', eyeColor: '#3a2418',
    brows: 'bold', headwear: 'headband', headwearColor: '#1f3f8a', shirt: '#c43a4a', neckline: 'v',
    accent: '#f6f2ea', shirtDetail: 'stripe',
  }),
  s('cricketer', 'Cricketer', {
    faceShape: 'round', skin: '#c08a5e', hairStyle: 'messy', hairColor: '#241a22', eyeColor: '#36231a',
    headwear: 'cap', headwearColor: '#1f4a6a', shirt: '#f2efe8', neckline: 'collar', accent: '#1f4a6a',
    shirtDetail: 'badge',
  }),
  s('basketballer', 'Basketballer', {
    faceShape: 'square', skin: '#6f4733', hairStyle: 'none', hairColor: '#20181f', eyeColor: '#2e1d16',
    eyeSize: 'small', brows: 'bold', headwear: 'headband', headwearColor: '#e8603a', shirt: '#e8603a',
    neckline: 'boat', accent: '#f6f2ea', shirtDetail: 'stripe',
  }),
  s('tennis', 'Tennis player', {
    faceShape: 'heart', skin: '#f1c4a0', hairStyle: 'ponytail', hairColor: '#8a6a3a', eyeColor: '#5a7aa0',
    lashes: 'soft', headwear: 'visor', headwearColor: '#8ac86a', shirt: '#f6f4ef', neckline: 'collar',
    accent: '#8ac86a',
  }),
  s('runner', 'Runner', {
    faceShape: 'oval', skin: '#5e3b2a', hairStyle: 'curly', hairColor: '#1d1520', eyeColor: '#2e1d16',
    eyeSize: 'large', headwear: 'headband', headwearColor: '#2f6f8f', shirt: '#e8505b', neckline: 'crew',
    accent: '#ffe08a', shirtDetail: 'stripe', neckAccessory: 'medal', neckAccessoryColor: '#3f6fb5',
  }),
  s('boxer', 'Boxer', {
    faceShape: 'square', skin: '#a06b45', hairStyle: 'buzz', hairColor: '#2a2026', eyeColor: '#3a2a22',
    brows: 'bold', headwear: 'grilledHelmet', headwearColor: '#b03a40', shirt: '#2b303c', neckline: 'crew',
    accent: '#e8c86a',
  }),
  s('swimmer', 'Swimmer', {
    faceShape: 'round', skin: '#e8b894', hairStyle: 'none', hairColor: '#4a3a2e', glasses: 'round',
    glassesColor: '#2f87b8', eyeColor: '#2f6f8f', eyeSize: 'large', headwear: 'surgicalCap',
    headwearColor: '#2f87b8', shirt: '#1f4a6a', neckline: 'boat', accent: '#9fd8e8',
  }),
  s('cyclist', 'Cyclist', {
    faceShape: 'square', skin: '#f5d0b0', hairStyle: 'buzz', hairColor: '#8a6a3a', glasses: 'square',
    glassesColor: '#e8a23a', eyeColor: '#4a6a8a', headwear: 'hardHat', headwearColor: '#4ad8c0',
    shirt: '#2f7f86', neckline: 'turtle', accent: '#f3c969', shirtDetail: 'stripe',
  }),
  s('skater', 'Skater', {
    faceShape: 'round', skin: '#d9a47a', hairStyle: 'messy', hairColor: '#3a2a4a', eyeColor: '#4a3524',
    lids: 'heavy', headwear: 'beanie', headwearColor: '#6a4fb8', shirt: '#2b2f3a', neckline: 'crew',
    accent: '#e8c86a', sideAccessory: 'headphones', sideAccessoryColor: '#e8603a',
  }),
  s('climber', 'Climber', {
    faceShape: 'oval', skin: '#8a5a3c', hairStyle: 'bun', hairColor: '#241a22', eyeColor: '#3a2418',
    eyeSize: 'large', headwear: 'hardHat', headwearColor: '#e8853a', shirt: '#4a6a56', neckline: 'crew',
    accent: '#d8c89a', neckAccessory: 'scarf', neckAccessoryColor: '#b05a4a',
  }),
  s('goalkeeper', 'Goalkeeper', {
    faceShape: 'square', skin: '#c08a5e', hairStyle: 'curly', hairColor: '#6a4a2e', eyeColor: '#4a3524',
    brows: 'bold', headwear: 'cap', headwearColor: '#3a8a5a', shirt: '#3a8a5a', neckline: 'collar',
    accent: '#f6f2ea', shirtDetail: 'stripe',
  }),
  s('umpire', 'Umpire', {
    faceShape: 'round', skin: '#6f4733', hairStyle: 'none', hairColor: '#8a8290', facialHair: 'stubble',
    eyeColor: '#2e1d16', lids: 'heavy', headwear: 'cap', headwearColor: '#23252e', shirt: '#2b2d36',
    neckline: 'collar', accent: '#e8c86a', neckAccessory: 'lanyard', neckAccessoryColor: '#4a4e5a',
  }),
])
