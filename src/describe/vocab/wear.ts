/**
 * The vocabulary for everything the character is wearing: glasses, headwear,
 * the two accessory slots, the neckline and the shirt. Most of these entries
 * carry a `colourSlot` as well as a patch, so "a red cap" costs one row.
 */
import type { ColourSlot, VocabEntry } from '../types'

/** Give a whole group the same colour slot, since a hat's colour is always the hat's. */
function allInto(slot: ColourSlot, entries: readonly VocabEntry[]): readonly VocabEntry[] {
  return entries.map((entry) => ({ ...entry, colourSlot: slot }))
}

export const GLASSES_WORDS: readonly VocabEntry[] = [
  {
    phrases: ['square glasses', 'rectangular glasses', 'rectangular specs', 'square specs', 'boxy glasses'],
    patch: { glasses: 'square' },
    colourSlot: 'glassesColor',
  },
  {
    phrases: [
      'round glasses', 'glasses', 'specs', 'spectacles', 'eyeglasses', 'wire glasses',
      'round specs', 'reading glasses',
    ],
    patch: { glasses: 'round' },
    colourSlot: 'glassesColor',
  },
]

const HATS: readonly VocabEntry[] = [
  { phrases: ['cap', 'baseball cap', 'hat', 'ball cap'], patch: { headwear: 'cap' } },
  { phrases: ['beanie', 'woolly hat', 'wool hat', 'bobble hat', 'knitted hat'], patch: { headwear: 'beanie' } },
  { phrases: ['antenna', 'antenna hat'], patch: { headwear: 'antenna' } },
  { phrases: ['hijab', 'headscarf', 'head scarf'], patch: { headwear: 'hijab' } },
  { phrases: ['hood', 'hoodie', 'hooded top'], patch: { headwear: 'hood' } },
  { phrases: ['toque', 'chefs hat', 'chef hat', 'cooks hat'], patch: { headwear: 'toque' } },
  { phrases: ['hard hat', 'safety helmet', 'builders helmet'], patch: { headwear: 'hardHat' } },
  { phrases: ['straw hat', 'sun hat', 'boater'], patch: { headwear: 'strawHat' } },
  { phrases: ['beret'], patch: { headwear: 'beret' } },
  { phrases: ['visor', 'sun visor'], patch: { headwear: 'visor' } },
  { phrases: ['headband', 'sweatband', 'head band'], patch: { headwear: 'headband' } },
  { phrases: ['grilled helmet', 'cage helmet', 'welding helmet'], patch: { headwear: 'grilledHelmet' } },
  {
    phrases: ['bubble helmet', 'space helmet', 'astronaut helmet', 'fish bowl helmet'],
    patch: { headwear: 'bubbleHelmet' },
  },
  { phrases: ['surgical cap', 'scrub cap', 'theatre cap'], patch: { headwear: 'surgicalCap' } },
]

export const HEADWEAR_WORDS: readonly VocabEntry[] = allInto('headwearColor', HATS)

const NECKWEAR: readonly VocabEntry[] = [
  { phrases: ['stethoscope'], patch: { neckAccessory: 'stethoscope' } },
  { phrases: ['apron', 'pinny'], patch: { neckAccessory: 'apron' } },
  { phrases: ['tie', 'necktie'], patch: { neckAccessory: 'tie' } },
  { phrases: ['lanyard', 'id badge lanyard'], patch: { neckAccessory: 'lanyard' } },
  { phrases: ['scarf', 'neck scarf', 'muffler'], patch: { neckAccessory: 'scarf' } },
  { phrases: ['medal', 'medallion', 'gold medal'], patch: { neckAccessory: 'medal' } },
]

export const NECK_WORDS: readonly VocabEntry[] = allInto('neckAccessoryColor', NECKWEAR)

const SIDEWEAR: readonly VocabEntry[] = [
  { phrases: ['headphones', 'cans', 'over ear headphones'], patch: { sideAccessory: 'headphones' } },
  { phrases: ['headset', 'gaming headset', 'mic headset'], patch: { sideAccessory: 'headset' } },
  {
    phrases: ['ear defenders', 'ear muffs', 'earmuffs', 'ear protection'],
    patch: { sideAccessory: 'earDefenders' },
  },
]

export const SIDE_WORDS: readonly VocabEntry[] = allInto('sideAccessoryColor', SIDEWEAR)

export const SHIRT_WORDS: readonly VocabEntry[] = [
  { phrases: ['v neck', 'vee neck'], patch: { neckline: 'v' } },
  { phrases: ['turtleneck', 'turtle neck', 'roll neck', 'polo neck'], patch: { neckline: 'turtle' } },
  { phrases: ['boat neck', 'boatneck'], patch: { neckline: 'boat' } },
  { phrases: ['collared shirt', 'shirt collar', 'collared', 'collar', 'buttoned shirt'], patch: { neckline: 'collar' } },
  { phrases: ['crew neck', 'crewneck', 'round neck'], patch: { neckline: 'crew' } },
  { phrases: ['scarf collar', 'cowl neck'], patch: { neckline: 'scarf' } },
  { phrases: ['striped', 'stripes', 'stripy', 'stripey', 'striped shirt'], patch: { shirtDetail: 'stripe' } },
  { phrases: ['badge', 'crest', 'logo', 'emblem'], patch: { shirtDetail: 'badge' } },
  {
    phrases: ['shirt', 'jumper', 'sweater', 'sweatshirt', 'top', 't shirt', 'tshirt', 'tee', 'jersey', 'blouse', 'kit'],
    colourSlot: 'shirt',
  },
  { phrases: ['accent', 'accents', 'trim', 'trimmed'], colourSlot: 'accent' },
]

export const WEAR_GROUPS: readonly (readonly VocabEntry[])[] = [
  GLASSES_WORDS, HEADWEAR_WORDS, NECK_WORDS, SIDE_WORDS, SHIRT_WORDS,
]
