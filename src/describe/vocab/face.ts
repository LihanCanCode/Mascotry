/**
 * The vocabulary for the character itself: what it is, its hair, its skin and
 * the features on its face. Every patch here is a legal partial config, so the
 * parser never has to know what any of these words mean.
 */
import type { VocabEntry } from '../types'

/** Animals carry the companion fields a preset would: no hair, a muzzle, a nose. */
export const ANIMAL_WORDS: readonly VocabEntry[] = [
  {
    phrases: ['cat', 'kitten', 'kitty', 'feline', 'cat ears', 'tabby'],
    patch: {
      ears: 'cat', hairStyle: 'none', muzzle: '#f4f1fa', earInner: '#f7a8c0', skin: '#b9b4c9',
      noseColor: '#4a2d3c',
    },
    colourSlot: 'skin',
  },
  {
    phrases: ['fox', 'wolf', 'husky', 'fox ears'],
    patch: {
      ears: 'fox', hairStyle: 'none', muzzle: '#fff3e2', earInner: '#fff3e2', earTip: '#4a2a2e',
      skin: '#f08a3c', noseColor: '#3a2430',
    },
    colourSlot: 'skin',
  },
  {
    phrases: ['bear', 'panda', 'koala', 'teddy', 'bear ears', 'hamster', 'otter', 'mouse'],
    patch: {
      ears: 'bear', hairStyle: 'none', muzzle: '#ecd0a8', earInner: '#d9a07a', skin: '#a8714a',
      noseColor: '#2f1d27',
    },
    colourSlot: 'skin',
  },
  {
    phrases: ['bunny', 'rabbit', 'hare', 'bunny ears'],
    patch: {
      ears: 'bunny', hairStyle: 'none', muzzle: '#ffffff', earInner: '#f7a8c0', skin: '#f3eef6',
      noseColor: '#c4738c',
    },
    colourSlot: 'skin',
  },
  {
    phrases: ['robot', 'android', 'bot', 'droid', 'machine', 'antennae', 'bolt ears'],
    patch: {
      ears: 'bolt', hairStyle: 'none', material: 'metal', skin: '#b9c4d0', muzzle: '#d7e0ea',
      earInner: '#8a98a8', noseColor: '#3b4350', blush: false,
    },
    colourSlot: 'skin',
  },
  { phrases: ['human ears', 'person', 'human', 'people'], patch: { ears: 'human' } },
  { phrases: ['fluffy cheeks', 'cheek fluff'], patch: { cheekFluff: 'fluff' } },
  { phrases: ['ruff', 'neck ruff'], patch: { cheekFluff: 'ruff' } },
  { phrases: ['eye patches', 'masked eyes', 'eye mask'], patch: { eyePatch: 'oval' }, colourSlot: 'patchColor' },
  { phrases: ['furry', 'fur'], patch: { material: 'fur' }, colourSlot: 'skin' },
  { phrases: ['metal', 'metallic', 'chrome', 'steel'], patch: { material: 'metal' }, colourSlot: 'skin' },
]

export const HAIR_WORDS: readonly VocabEntry[] = [
  { phrases: ['curly', 'curls', 'curly hair', 'afro', 'frizzy', 'coily', 'wavy'], patch: { hairStyle: 'curly' } },
  { phrases: ['bob', 'bob cut', 'bobbed hair', 'shoulder length hair', 'shoulder length'], patch: { hairStyle: 'bob' } },
  {
    phrases: ['buzz', 'buzz cut', 'crew cut', 'cropped hair', 'shaved head', 'short hair', 'close cropped'],
    patch: { hairStyle: 'buzz' },
  },
  { phrases: ['bun', 'top bun', 'topknot', 'top knot', 'hair bun'], patch: { hairStyle: 'bun' } },
  { phrases: ['ponytail', 'pony tail', 'long hair', 'tied back hair'], patch: { hairStyle: 'ponytail' } },
  { phrases: ['messy hair', 'messy', 'scruffy hair', 'tousled', 'bedhead'], patch: { hairStyle: 'messy' } },
  { phrases: ['bald', 'bald head', 'hairless', 'no hairline'], patch: { hairStyle: 'none' } },
  {
    phrases: ['hair', 'hairstyle', 'hair style'],
    colourSlot: 'hairColor',
    off: { hairStyle: 'none' },
  },
]

/** Named hair tones. Separate from the colour table because "dark hair" is not "dark" plus "hair". */
export const HAIR_TONES: readonly VocabEntry[] = [
  { phrases: ['blonde', 'blond', 'blonde hair', 'blond hair'], patch: { hairColor: '#e0bf7a' } },
  { phrases: ['platinum blonde', 'bleached hair'], patch: { hairColor: '#efe4c8' } },
  { phrases: ['ginger', 'ginger hair', 'red hair', 'redhead'], patch: { hairColor: '#c4572a' } },
  { phrases: ['auburn', 'auburn hair'], patch: { hairColor: '#8a3a22' } },
  { phrases: ['brunette', 'brown hair', 'chestnut hair'], patch: { hairColor: '#4a3326' } },
  { phrases: ['black hair', 'jet black hair', 'jet black'], patch: { hairColor: '#1e1b24' } },
  { phrases: ['grey hair', 'gray hair', 'silver hair', 'greying hair'], patch: { hairColor: '#9aa0a8' } },
  { phrases: ['white hair'], patch: { hairColor: '#ece9f2' } },
  { phrases: ['dark hair'], patch: { hairColor: '#2b2230' } },
  { phrases: ['light hair', 'fair hair'], patch: { hairColor: '#c9a978' } },
]

/**
 * Named skin tones, light to dark.
 *
 * Spelled out rather than built from the colour table, because the words people
 * reach for here ("fair", "olive", "deep brown") are not colour words and the
 * ones that are ("brown") do not mean the same thing on skin as on a jumper.
 */
export const SKIN_TONES: readonly VocabEntry[] = [
  { phrases: ['porcelain skin', 'very pale skin'], patch: { skin: '#f8e0d0' } },
  { phrases: ['pale skin', 'fair skin', 'light skin'], patch: { skin: '#f6d9c0' } },
  { phrases: ['beige skin', 'medium skin'], patch: { skin: '#e8bb96' } },
  { phrases: ['olive skin'], patch: { skin: '#cda06a' } },
  { phrases: ['tan skin', 'tanned skin', 'golden skin'], patch: { skin: '#c98a5e' } },
  { phrases: ['bronze skin'], patch: { skin: '#b0703f' } },
  { phrases: ['brown skin', 'mid brown skin'], patch: { skin: '#8a5a38' } },
  { phrases: ['deep brown skin', 'dark brown skin'], patch: { skin: '#5f3a24' } },
  { phrases: ['dark skin', 'deep skin'], patch: { skin: '#5a3824' } },
  { phrases: ['ebony skin', 'black skin', 'very dark skin'], patch: { skin: '#43281c' } },
  { phrases: ['skin', 'complexion', 'skin tone'], colourSlot: 'skin' },
]

export const FACE_WORDS: readonly VocabEntry[] = [
  { phrases: ['round face', 'round head', 'circular face'], patch: { faceShape: 'round' } },
  { phrases: ['oval face', 'long face', 'oval head'], patch: { faceShape: 'oval' } },
  { phrases: ['square face', 'square jaw', 'strong jaw', 'square head'], patch: { faceShape: 'square' } },
  { phrases: ['heart shaped face', 'heart face', 'pointed chin'], patch: { faceShape: 'heart' } },
  { phrases: ['stubble', 'five o clock shadow', 'five oclock shadow', 'scruff'], patch: { facialHair: 'stubble' } },
  {
    phrases: ['moustache', 'mustache', 'tache', 'handlebar moustache'],
    patch: { facialHair: 'moustache' },
    colourSlot: 'facialHairColor',
  },
  {
    phrases: ['beard', 'bearded', 'goatee', 'full beard', 'short beard', 'long beard'],
    patch: { facialHair: 'beard' },
    colourSlot: 'facialHairColor',
  },
  { phrases: ['big eyes', 'large eyes', 'wide eyes', 'huge eyes'], patch: { eyeSize: 'large' } },
  { phrases: ['small eyes', 'beady eyes', 'narrow eyes', 'tiny eyes'], patch: { eyeSize: 'small' } },
  { phrases: ['medium eyes'], patch: { eyeSize: 'medium' } },
  { phrases: ['long lashes', 'long eyelashes'], patch: { lashes: 'long' } },
  { phrases: ['lashes', 'eyelashes', 'soft lashes'], patch: { lashes: 'soft' } },
  { phrases: ['sleepy eyes', 'tired eyes', 'half closed eyes'], patch: { lids: 'sleepy' } },
  { phrases: ['hooded eyes', 'heavy lids', 'heavy eyelids'], patch: { lids: 'heavy' } },
  { phrases: ['bold brows', 'thick eyebrows', 'bushy eyebrows', 'thick brows'], patch: { brows: 'bold' } },
  { phrases: ['thin brows', 'thin eyebrows'], patch: { brows: 'thin' } },
  { phrases: ['arched brows', 'arched eyebrows'], patch: { brows: 'arched' } },
  { phrases: ['soft brows', 'eyebrows', 'brows'], patch: { brows: 'soft' } },
  { phrases: ['rosy cheeks', 'blush', 'blushing', 'flushed cheeks'], patch: { blush: true } },
  { phrases: ['eyes', 'eye colour', 'eye color'], colourSlot: 'eyeColor' },
  { phrases: ['nose'], colourSlot: 'noseColor' },
  { phrases: ['muzzle', 'snout'], colourSlot: 'muzzle' },
]
