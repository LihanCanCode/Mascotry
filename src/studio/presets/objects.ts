// Characters that are things rather than people: a different head is the big job, so for now the
// group is the one the existing rig already draws.
import { make } from './preset'
import type { StudioPreset } from './preset'

const o = make('object')

export const OBJECTS: readonly StudioPreset[] = Object.freeze([
  o('robot', 'Robot', {
    faceShape: 'square', ears: 'bolt', skin: '#b9c8da', hairStyle: 'none', headwear: 'antenna', eyeColor: '#18b7d9',
    eyeSize: 'large', blush: false, accent: '#ffb02e', shirt: '#5a6a85', neckline: 'boat', shirtDetail: 'badge',
  }),
])
