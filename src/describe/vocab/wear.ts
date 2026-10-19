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
  { phrases: ['hood'], patch: { headwear: 'hood' } },
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

export const HEADWEAR_WORDS: readonly VocabEntry[] = [
  ...allInto('headwearColor', HATS),
  // A hoodie is a garment as much as a hat, and a red one is red in both
  // places, so its colour fills the hood and the top together.
  {
    phrases: ['hoodie', 'hooded top', 'hooded jumper'],
    patch: { headwear: 'hood' },
    colourSlot: 'headwearColor',
    alsoSlot: 'shirt',
  },
]

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

/**
 * The garment words, and what a colour in front of one of them fills.
 *
 * The neckline is a shape, so a colour on it belongs to the shirt — except the
 * collar, the stripes and the badge, which the rig genuinely draws in the
 * accent colour. So "a white collar" gives a white collar on whatever shirt is
 * already there, rather than repainting the whole shirt.
 */
export const SHIRT_WORDS: readonly VocabEntry[] = [
  { phrases: ['v neck', 'vee neck'], patch: { neckline: 'v' }, colourSlot: 'shirt' },
  {
    phrases: ['turtleneck', 'turtle neck', 'roll neck', 'polo neck'],
    patch: { neckline: 'turtle' },
    colourSlot: 'shirt',
  },
  { phrases: ['boat neck', 'boatneck'], patch: { neckline: 'boat' }, colourSlot: 'shirt' },
  {
    phrases: ['collared shirt', 'shirt collar', 'collared', 'collar', 'buttoned shirt', 'button up'],
    patch: { neckline: 'collar' },
    colourSlot: 'accent',
  },
  { phrases: ['crew neck', 'crewneck', 'round neck'], patch: { neckline: 'crew' }, colourSlot: 'shirt' },
  { phrases: ['scarf collar', 'cowl neck'], patch: { neckline: 'scarf' }, colourSlot: 'shirt' },
  {
    phrases: ['striped', 'stripes', 'stripy', 'stripey', 'striped shirt'],
    patch: { shirtDetail: 'stripe' },
    colourSlot: 'accent',
  },
  { phrases: ['badge', 'crest', 'logo', 'emblem'], patch: { shirtDetail: 'badge' }, colourSlot: 'accent' },
  {
    phrases: [
      'shirt', 'jumper', 'sweater', 'sweatshirt', 'top', 't shirt', 'tshirt', 'tee', 'jersey', 'blouse', 'kit',
      'pullover', 'dress', 'robe', 'gown', 'outfit', 'clothes',
    ],
    colourSlot: 'shirt',
  },
  {
    phrases: [
      'blazer', 'jacket', 'coat', 'suit', 'cardigan', 'waistcoat', 'vest', 'uniform', 'overalls', 'dungarees',
    ],
    patch: { neckline: 'collar' },
    colourSlot: 'shirt',
  },
  { phrases: ['accent', 'accents', 'trim', 'trimmed', 'detail'], colourSlot: 'accent' },
]

export const WEAR_GROUPS: readonly (readonly VocabEntry[])[] = [
  GLASSES_WORDS, HEADWEAR_WORDS, NECK_WORDS, SIDE_WORDS, SHIRT_WORDS,
]
