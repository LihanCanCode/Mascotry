/**
 * The config-only animals: everything here is built from ears, muzzle, cheek ruff and eye patch
 * the rig already has, so the whole group costs nothing but colour. Colours avoid pure green so
 * the #00FF00 key path stays a fair test.
 */
import { make } from './preset'
import type { StudioPreset } from './preset'

const a = make('animal')

export const ANIMALS: readonly StudioPreset[] = Object.freeze([
  a('fox', 'Fox', {
    ears: 'fox', skin: '#f08a3c', muzzle: '#fff3e2', earInner: '#fff3e2', earTip: '#4a2a2e', noseColor: '#3a2430',
    hairStyle: 'none', eyeColor: '#7a4a1e', lashes: 'soft', shirt: '#3f6fb5', neckline: 'scarf', accent: '#e6465a',
  }),
  a('bear', 'Bear', {
    ears: 'bear', skin: '#a8714a', muzzle: '#ecd0a8', earInner: '#d9a07a', noseColor: '#2f1d27', hairStyle: 'none',
    eyeColor: '#3a2418', eyeSize: 'small', brows: 'bold', shirt: '#e8a23a', neckline: 'crew', accent: '#fff3d6',
    shirtDetail: 'stripe', blushColor: '#ff8aa0',
  }),
  a('cat', 'Cat', {
    ears: 'cat', skin: '#b9b4c9', muzzle: '#f4f1fa', earInner: '#f7a8c0', hairStyle: 'none', eyeColor: '#2f87b8',
    lashes: 'long', eyeSize: 'large', brows: 'thin', shirt: '#c05fa8', neckline: 'v', accent: '#ffd36b',
    shirtDetail: 'badge',
  }),
  a('bunny', 'Bunny', {
    ears: 'bunny', skin: '#f3eef6', muzzle: '#ffffff', earInner: '#f7a8c0', hairStyle: 'none', eyeColor: '#a03d6a',
    eyeSize: 'large', lashes: 'soft', shirt: '#7aa6e8', neckline: 'turtle', accent: '#ffb3c8', blushColor: '#ff7fa0',
  }),
  a('panda', 'Panda', {
    ears: 'bear', skin: '#f7f4fa', muzzle: '#ffffff', earColor: '#2b2430', earInner: '#5a4f66', noseColor: '#2b2430',
    eyePatch: 'oval', patchColor: '#2e2735', hairStyle: 'none', eyeColor: '#9a86b0', brows: 'bold', blush: false,
    shirt: '#5fa886', neckline: 'crew', accent: '#ffe08a', shirtDetail: 'badge',
  }),
  a('redpanda', 'Red panda', {
    ears: 'bear', skin: '#c45e32', muzzle: '#fbf3e6', earColor: '#e8d8c4', earInner: '#f2c7ad', noseColor: '#2a1a22',
    eyePatch: 'oval', patchColor: '#fbf3e6', hairStyle: 'none', cheekFluff: 'ruff', eyeColor: '#2e1c14',
    eyeSize: 'medium', brows: 'soft', shirt: '#3c6e63', neckline: 'crew', accent: '#f6d06a', blushColor: '#e07a66',
  }),
  a('wolf', 'Wolf', {
    ears: 'fox', skin: '#8e949f', muzzle: '#dfe3ea', earInner: '#c6b4bb', earTip: '#3a3f4a', noseColor: '#282c36',
    hairStyle: 'none', cheekFluff: 'ruff', eyeColor: '#c2a13c', eyeSize: 'medium', brows: 'bold', blush: false,
    shirt: '#39507a', neckline: 'collar', accent: '#cfd8e6',
  }),
  a('koala', 'Koala', {
    ears: 'bear', skin: '#a3a8b4', muzzle: '#d8dce4', earInner: '#cfc0cc', noseColor: '#3a2f3c', hairStyle: 'none',
    cheekFluff: 'fluff', eyeColor: '#32262c', eyeSize: 'small', brows: 'soft', shirt: '#7fa65c', neckline: 'crew',
    accent: '#e8eed8', shirtDetail: 'stripe',
  }),
  a('squirrel', 'Squirrel', {
    ears: 'cat', skin: '#b4713f', muzzle: '#f6e4cc', earInner: '#e0a87e', noseColor: '#3a2430', hairStyle: 'none',
    cheekFluff: 'ruff', eyeColor: '#241812', eyeSize: 'large', lashes: 'soft', shirt: '#6a5aa8', neckline: 'v',
    accent: '#f3c969',
  }),
  a('hamster', 'Hamster', {
    ears: 'bear', skin: '#e8c08a', muzzle: '#fdf2e2', earInner: '#f0b0b8', noseColor: '#6a4a52', hairStyle: 'none',
    cheekFluff: 'fluff', eyeColor: '#2e2026', eyeSize: 'large', shirt: '#4f8fb0', neckline: 'turtle',
    accent: '#ffe6b0', blushColor: '#ff9fae',
  }),
  a('otter', 'Otter', {
    ears: 'bear', skin: '#7b5a44', muzzle: '#d9c3a4', earInner: '#a8826a', noseColor: '#2a1c22', hairStyle: 'none',
    eyeColor: '#1e140f', eyeSize: 'large', brows: 'soft', shirt: '#2f8a8a', neckline: 'crew', accent: '#ffd9a0',
    shirtDetail: 'badge',
  }),
  a('mouse', 'Mouse', {
    ears: 'bear', skin: '#b8b2c0', muzzle: '#f2eef6', earInner: '#f4aec2', earColor: '#aaa2b4', noseColor: '#c06a80',
    hairStyle: 'none', eyeColor: '#241c2a', eyeSize: 'large', lashes: 'soft', shirt: '#d98a4a', neckline: 'collar',
    accent: '#fff0d8',
  }),
])
