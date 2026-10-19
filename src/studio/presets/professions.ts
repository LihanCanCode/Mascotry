/**
 * Pick your job. A profession here is a hat, a neck accessory and a shirt colour — never a fixed
 * face: the skin tones, hair types and features are spread deliberately across the set so that
 * nobody arriving at the gallery finds their trade already decided for them. Every one of these
 * is a config a visitor can recolour the moment they open the studio.
 */
import { make } from './preset'
import type { StudioPreset } from './preset'

const j = make('profession')

export const PROFESSIONS: readonly StudioPreset[] = Object.freeze([
  j('hacker', 'Hacker', {
    faceShape: 'oval', skin: '#c08a5e', hairStyle: 'none', hairColor: '#1b1722', eyeColor: '#2fd0c0',
    eyeSize: 'large', brows: 'thin', glasses: 'square', glassesColor: '#1f2330', blush: false,
    headwear: 'hood', headwearColor: '#2b3242', shirt: '#1e2230', neckline: 'crew', accent: '#2fd0c0',
    outline: '#191b26',
  }),
  j('farmer', 'Farmer', {
    faceShape: 'square', skin: '#d9a47a', hairStyle: 'messy', hairColor: '#6a4a2e', facialHair: 'beard',
    eyeColor: '#4a3524', eyeSize: 'small', brows: 'bold', headwear: 'strawHat', headwearColor: '#e2bd72',
    shirt: '#7a9a56', neckline: 'collar', accent: '#b4532e', shirtDetail: 'stripe',
  }),
  j('builder', 'Builder', {
    faceShape: 'square', skin: '#b4713f', hairStyle: 'buzz', hairColor: '#2a2026', eyeColor: '#2e1c14',
    brows: 'bold', headwear: 'hardHat', headwearColor: '#f0b429', shirt: '#4a6a9a', neckline: 'crew',
    accent: '#ffe6a8', sideAccessory: 'earDefenders', sideAccessoryColor: '#e8604a',
  }),
  j('doctor', 'Doctor', {
    faceShape: 'oval', skin: '#8a5a3c', hairStyle: 'bun', hairColor: '#241a22', eyeColor: '#3a2418',
    eyeSize: 'large', lashes: 'soft', shirt: '#f3f1ee', neckline: 'collar', accent: '#9fc6d8',
    neckAccessory: 'stethoscope', neckAccessoryColor: '#3d4654',
  }),
  j('nurse', 'Nurse', {
    faceShape: 'round', skin: '#f1c4a0', hairStyle: 'ponytail', hairColor: '#b5522e', eyeColor: '#5a7aa0',
    headwear: 'surgicalCap', headwearColor: '#6fb3c8', shirt: '#4f9fb0', neckline: 'v', accent: '#eef6f8',
    neckAccessory: 'lanyard', neckAccessoryColor: '#2f6f80',
  }),
  j('engineer', 'Engineer', {
    faceShape: 'heart', skin: '#e8b894', hairStyle: 'bob', hairColor: '#4a3a2e', glasses: 'square',
    glassesColor: '#3d3d55', eyeColor: '#4a6a8a', headwear: 'hardHat', headwearColor: '#3f86c0',
    shirt: '#546a86', neckline: 'collar', accent: '#f0b429', neckAccessory: 'lanyard',
    neckAccessoryColor: '#3a4656',
  }),
  j('chef', 'Chef', {
    faceShape: 'square', skin: '#6f4733', hairStyle: 'buzz', hairColor: '#20181f', facialHair: 'moustache',
    eyeColor: '#2e1d16', brows: 'bold', headwear: 'toque', headwearColor: '#f6f4ef', shirt: '#eae6df',
    neckline: 'collar', accent: '#d94a4a', neckAccessory: 'apron', neckAccessoryColor: '#9aa6ba',
  }),
  j('barista', 'Barista', {
    faceShape: 'round', skin: '#a06b45', hairStyle: 'curly', hairColor: '#2a1d20', eyeColor: '#36231a',
    eyeSize: 'large', headwear: 'headband', headwearColor: '#35584a', shirt: '#d8d2c6', neckline: 'crew',
    accent: '#8a5a3a', neckAccessory: 'apron', neckAccessoryColor: '#35584a',
  }),
  j('teacher', 'Teacher', {
    faceShape: 'heart', skin: '#f5d0b0', hairStyle: 'bob', hairColor: '#8a6a3a', glasses: 'round',
    glassesColor: '#5a4030', eyeColor: '#2f6f8f', lashes: 'soft', brows: 'arched', shirt: '#6a7fb8',
    neckline: 'collar', accent: '#f0e0c0', neckAccessory: 'tie', neckAccessoryColor: '#9a3a4a',
  }),
  j('scientist', 'Scientist', {
    faceShape: 'oval', skin: '#5e3b2a', hairStyle: 'curly', hairColor: '#1d1520', glasses: 'round',
    glassesColor: '#2b2b3d', eyeColor: '#3a2418', eyeSize: 'large', shirt: '#f4f2ee', neckline: 'collar',
    accent: '#6a8fd8', neckAccessory: 'lanyard', neckAccessoryColor: '#4a5a6a',
  }),
  j('mechanic', 'Mechanic', {
    faceShape: 'square', skin: '#c08a5e', hairStyle: 'messy', hairColor: '#2a2026', facialHair: 'stubble',
    eyeColor: '#3a2a22', brows: 'bold', headwear: 'cap', headwearColor: '#39506a', shirt: '#4a5260',
    neckline: 'collar', accent: '#e8a23a', neckAccessory: 'apron', neckAccessoryColor: '#2f3540',
  }),
  j('firefighter', 'Firefighter', {
    faceShape: 'round', skin: '#8a5a3c', hairStyle: 'buzz', hairColor: '#20181f', eyeColor: '#2e1d16',
    brows: 'bold', headwear: 'hardHat', headwearColor: '#d03a32', shirt: '#2b303c', neckline: 'crew',
    accent: '#f3c969', shirtDetail: 'badge',
  }),
  j('pilot', 'Pilot', {
    faceShape: 'oval', skin: '#e8b894', hairStyle: 'bun', hairColor: '#3a2a2a', eyeColor: '#4a6a8a',
    lashes: 'soft', headwear: 'cap', headwearColor: '#23304a', shirt: '#2d3a56', neckline: 'collar',
    accent: '#e8c86a', shirtDetail: 'badge', neckAccessory: 'tie', neckAccessoryColor: '#1b2334',
  }),
  j('postie', 'Postal worker', {
    faceShape: 'round', skin: '#6f4733', hairStyle: 'bob', hairColor: '#20181f', eyeColor: '#2e1d16',
    eyeSize: 'large', headwear: 'cap', headwearColor: '#2f6fb0', shirt: '#3f7fc0', neckline: 'collar',
    accent: '#f6e8c8', shirtDetail: 'badge', neckAccessory: 'lanyard', neckAccessoryColor: '#24507e',
  }),
  j('artist', 'Artist', {
    faceShape: 'heart', skin: '#f1c4a0', hairStyle: 'bun', hairColor: '#7a3b2a', eyeColor: '#2f6f8f',
    lashes: 'long', brows: 'arched', headwear: 'beret', headwearColor: '#b03a56', shirt: '#e6e2d8',
    neckline: 'boat', accent: '#4a8a86', neckAccessory: 'apron', neckAccessoryColor: '#6a5a8a',
  }),
  j('musician', 'Musician', {
    faceShape: 'oval', skin: '#a06b45', hairStyle: 'curly', hairColor: '#241a22', eyeColor: '#36231a',
    eyeSize: 'large', shirt: '#30283c', neckline: 'crew', accent: '#e8a23a',
    sideAccessory: 'headphones', sideAccessoryColor: '#c0562e', neckAccessory: 'scarf',
    neckAccessoryColor: '#7a4a8a',
  }),
  j('gamer', 'Gamer', {
    faceShape: 'round', skin: '#e8b894', hairStyle: 'messy', hairColor: '#3a2a4a', eyeColor: '#4a6a8a',
    glasses: 'square', glassesColor: '#2b2b3d', shirt: '#2b2f4a', neckline: 'crew', accent: '#4ad8c0',
    sideAccessory: 'headset', sideAccessoryColor: '#454c66',
  }),
  j('librarian', 'Librarian', {
    faceShape: 'heart', skin: '#e9bf9d', hairStyle: 'none', hairColor: '#bdb5c4', facialHair: 'moustache',
    facialHairColor: '#d9d3de', glasses: 'round', glassesColor: '#6b4a2e', eyeColor: '#5a4a3a',
    eyeSize: 'small', lids: 'heavy', brows: 'bold', shirt: '#b98a5a', neckline: 'collar', accent: '#f4ead8',
    neckAccessory: 'lanyard', neckAccessoryColor: '#4a5a6a',
  }),
  j('vet', 'Vet', {
    faceShape: 'round', skin: '#d9a47a', hairStyle: 'ponytail', hairColor: '#4a3a2e', eyeColor: '#4a3524',
    eyeSize: 'large', lashes: 'soft', shirt: '#3f8a7a', neckline: 'v', accent: '#eaf4f0',
    shirtDetail: 'badge', neckAccessory: 'stethoscope', neckAccessoryColor: '#2a3a42',
  }),
  j('welder', 'Welder', {
    faceShape: 'square', skin: '#8a5a3c', hairStyle: 'buzz', hairColor: '#241a22', eyeColor: '#2e1d16',
    brows: 'bold', headwear: 'visor', headwearColor: '#3b4350', shirt: '#5a4a3a', neckline: 'crew',
    accent: '#e8a23a', neckAccessory: 'apron', neckAccessoryColor: '#6a5240',
  }),
  j('gardener', 'Gardener', {
    faceShape: 'oval', skin: '#c08a5e', hairStyle: 'messy', hairColor: '#8a6a3a', glasses: 'round',
    glassesColor: '#4a6a3a', eyeColor: '#4a3524', lids: 'heavy', headwear: 'beanie',
    headwearColor: '#5a7a46', shirt: '#b0a88e', neckline: 'collar', accent: '#d8c89a',
    neckAccessory: 'apron', neckAccessoryColor: '#6a5a3a',
  }),
  j('astronaut', 'Astronaut', {
    faceShape: 'round', skin: '#f5d0b0', hairStyle: 'buzz', hairColor: '#4a3a2e', eyeColor: '#4a6a8a',
    eyeSize: 'large', headwear: 'bubbleHelmet', headwearColor: '#cfd8e6', shirt: '#eceae4',
    neckline: 'turtle', accent: '#e8603a', shirtDetail: 'badge',
  }),
  j('detective', 'Detective', {
    faceShape: 'square', skin: '#a06b45', hairStyle: 'none', hairColor: '#8a8290', facialHair: 'moustache',
    facialHairColor: '#a8a0ae', glasses: 'round', glassesColor: '#4a3a2e', eyeColor: '#3a2a22',
    eyeSize: 'small', lids: 'heavy', headwear: 'cap', headwearColor: '#6a5a46', shirt: '#4a4034',
    neckline: 'collar', accent: '#c8b48a', neckAccessory: 'tie', neckAccessoryColor: '#5a3a3a',
  }),
  j('baker', 'Baker', {
    faceShape: 'heart', skin: '#f1c4a0', hairStyle: 'bun', hairColor: '#b5522e', eyeColor: '#5a7aa0',
    lashes: 'soft', blushColor: '#f09aa8', headwear: 'surgicalCap', headwearColor: '#f6f4ef',
    shirt: '#d8b48a', neckline: 'collar', accent: '#a06a3a', neckAccessory: 'apron',
    neckAccessoryColor: '#eae2d2',
  }),
])
