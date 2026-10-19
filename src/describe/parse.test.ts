import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../studio'
import type { StudioConfig } from '../studio'
import { describeToConfig } from './parse'

/** The config a description produces, for the common case of asserting one field. */
function cfg(text: string): StudioConfig {
  return describeToConfig(text).config
}

describe('describeToConfig', () => {
  it('returns the default character for an empty description', () => {
    const result = describeToConfig('')
    expect(result.config).toEqual(DEFAULT_CONFIG)
    expect(result.matched).toEqual([])
    expect(result.ignored).toEqual([])
  })

  it('returns the default character for whitespace and punctuation alone', () => {
    const result = describeToConfig('   ...  !! ')
    expect(result.config).toEqual(DEFAULT_CONFIG)
    expect(result.matched).toEqual([])
  })

  it('reads the headline example end to end', () => {
    const result = describeToConfig('curly dark hair, round glasses, short beard, green jumper, brown skin')
    expect(result.config.hairStyle).toBe('curly')
    expect(result.config.glasses).toBe('round')
    expect(result.config.facialHair).toBe('beard')
    expect(result.config.shirt).not.toBe(DEFAULT_CONFIG.shirt)
    expect(result.config.skin).not.toBe(DEFAULT_CONFIG.skin)
    expect(result.matched).toContain('curly')
    expect(result.matched).toContain('round glasses')
    expect(result.ignored).toEqual([])
  })

  it('reads the second headline example end to end', () => {
    const result = describeToConfig('a grey cat in a red scarf')
    expect(result.config.ears).toBe('cat')
    expect(result.config.skin).toBe('#9aa0a8')
    expect(result.config.neckAccessory).toBe('scarf')
    expect(result.config.neckAccessoryColor).toBe('#d23b3b')
    expect(result.ignored).toEqual([])
  })

  it('leaves the default config untouched', () => {
    describeToConfig('bald, no glasses, black shirt')
    expect(DEFAULT_CONFIG.hairStyle).toBe('messy')
    expect(DEFAULT_CONFIG.shirt).toBe('#5b7bd5')
  })

  describe('animals and their ears', () => {
    const cases: readonly (readonly [string, string])[] = [
      ['a fox', 'fox'], ['wolf', 'fox'], ['a cat', 'cat'], ['kitten', 'cat'], ['a bear', 'bear'],
      ['panda', 'bear'], ['koala', 'bear'], ['bunny', 'bunny'], ['rabbit', 'bunny'],
      ['a robot', 'bolt'], ['android', 'bolt'],
    ]
    it.each(cases)('%s gets %s ears', (text, ears) => {
      expect(cfg(text).ears).toBe(ears)
    })

    it('drops the hair when an animal is asked for', () => {
      expect(cfg('a cat').hairStyle).toBe('none')
    })

    it('gives a robot a metal surface', () => {
      expect(cfg('a robot').material).toBe('metal')
    })

    it('still lets a named animal be recoloured', () => {
      expect(cfg('a white bunny').skin).toBe('#f7f4fa')
    })
  })

  describe('hair', () => {
    const styles: readonly (readonly [string, string])[] = [
      ['curly hair', 'curly'], ['afro', 'curly'], ['a bob', 'bob'], ['buzz cut', 'buzz'],
      ['shaved head', 'buzz'], ['a bun', 'bun'], ['topknot', 'bun'], ['ponytail', 'ponytail'],
      ['messy hair', 'messy'], ['bald', 'none'], ['long hair', 'ponytail'], ['short hair', 'buzz'],
      ['shoulder length hair', 'bob'],
    ]
    it.each(styles)('%s is the %s style', (text, style) => {
      expect(cfg(text).hairStyle).toBe(style)
    })

    const tones: readonly (readonly [string, string])[] = [
      ['blonde', '#e0bf7a'], ['ginger hair', '#c4572a'], ['auburn hair', '#8a3a22'],
      ['jet black hair', '#1e1b24'], ['grey hair', '#9aa0a8'],
    ]
    it.each(tones)('%s is a named hair tone', (text, hex) => {
      expect(cfg(text).hairColor).toBe(hex)
    })

    it('takes a colour word for the hair from the word order alone', () => {
      expect(cfg('blue hair').hairColor).toBe('#3f6fb5')
    })

    it('takes a modified colour word for the hair', () => {
      const dark = cfg('dark green hair').hairColor
      const plain = cfg('green hair').hairColor
      expect(dark).not.toBe(plain)
      expect(dark.length).toBe(7)
    })
  })

  describe('skin', () => {
    const tones: readonly string[] = [
      'pale skin', 'fair skin', 'light skin', 'olive skin', 'tan skin', 'brown skin', 'dark skin',
      'deep brown skin', 'ebony skin',
    ]
    it.each(tones)('%s is a distinct skin tone', (text) => {
      expect(cfg(text).skin).not.toBe(DEFAULT_CONFIG.skin)
    })

    it('orders the tones from light to dark', () => {
      const lum = (hex: string): number => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16)
      expect(lum(cfg('pale skin').skin)).toBeGreaterThan(lum(cfg('tan skin').skin))
      expect(lum(cfg('tan skin').skin)).toBeGreaterThan(lum(cfg('dark skin').skin))
    })
  })

  describe('facial hair, glasses, headwear and the rest', () => {
    it.each([
      ['stubble', 'stubble'], ['five o clock shadow', 'stubble'], ['a moustache', 'moustache'],
      ['mustache', 'moustache'], ['a beard', 'beard'], ['bearded', 'beard'], ['goatee', 'beard'],
    ])('%s is %s', (text, value) => {
      expect(cfg(text).facialHair).toBe(value)
    })

    it.each([
      ['glasses', 'round'], ['specs', 'round'], ['spectacles', 'round'],
      ['square glasses', 'square'], ['rectangular specs', 'square'], ['round glasses', 'round'],
    ])('%s is %s glasses', (text, value) => {
      expect(cfg(text).glasses).toBe(value)
    })

    it.each([
      ['a cap', 'cap'], ['baseball cap', 'cap'], ['beanie', 'beanie'], ['woolly hat', 'beanie'],
      ['wool hat', 'beanie'], ['hijab', 'hijab'], ['a hood', 'hood'], ['hard hat', 'hardHat'],
      ['straw hat', 'strawHat'], ['beret', 'beret'], ['visor', 'visor'], ['headband', 'headband'],
      ['space helmet', 'bubbleHelmet'], ['surgical cap', 'surgicalCap'], ['chefs hat', 'toque'],
    ])('%s is the %s headwear', (text, value) => {
      expect(cfg(text).headwear).toBe(value)
    })

    it.each([
      ['a tie', 'tie'], ['stethoscope', 'stethoscope'], ['an apron', 'apron'],
      ['lanyard', 'lanyard'], ['a scarf', 'scarf'], ['a medal', 'medal'],
    ])('%s is the %s neck accessory', (text, value) => {
      expect(cfg(text).neckAccessory).toBe(value)
    })

    it.each([
      ['headphones', 'headphones'], ['a headset', 'headset'], ['ear defenders', 'earDefenders'],
      ['ear muffs', 'earDefenders'],
    ])('%s is the %s side accessory', (text, value) => {
      expect(cfg(text).sideAccessory).toBe(value)
    })

    it.each([
      ['v neck', 'v'], ['turtleneck', 'turtle'], ['roll neck', 'turtle'], ['boat neck', 'boat'],
      ['collared shirt', 'collar'], ['crew neck', 'crew'],
    ])('%s is the %s neckline', (text, value) => {
      expect(cfg(text).neckline).toBe(value)
    })

    it.each([
      ['striped shirt', 'stripe'], ['a badge', 'badge'], ['stripy top', 'stripe'],
    ])('%s is the %s shirt detail', (text, value) => {
      expect(cfg(text).shirtDetail).toBe(value)
    })

    it.each([
      ['big eyes', 'large'], ['large eyes', 'large'], ['small eyes', 'small'],
      ['beady eyes', 'small'], ['wide eyes', 'large'],
    ])('%s is %s eyes', (text, value) => {
      expect(cfg(text).eyeSize).toBe(value)
    })

    it.each([
      ['long lashes', 'long'], ['eyelashes', 'soft'],
    ])('%s is %s lashes', (text, value) => {
      expect(cfg(text).lashes).toBe(value)
    })

    it.each([
      ['sleepy eyes', 'sleepy'], ['hooded eyes', 'heavy'],
    ])('%s is the %s lid', (text, value) => {
      expect(cfg(text).lids).toBe(value)
    })

    it.each([
      ['bold brows', 'bold'], ['thick eyebrows', 'bold'], ['thin brows', 'thin'],
      ['arched eyebrows', 'arched'],
    ])('%s is the %s brow', (text, value) => {
      expect(cfg(text).brows).toBe(value)
    })

    it.each([
      ['round face', 'round'], ['oval face', 'oval'], ['square jaw', 'square'],
      ['heart shaped face', 'heart'],
    ])('%s is the %s face shape', (text, value) => {
      expect(cfg(text).faceShape).toBe(value)
    })

    it('reads blushed cheeks', () => {
      expect(cfg('rosy cheeks').blush).toBe(true)
    })
  })

  describe('synonyms', () => {
    it.each([['specs'], ['glasses'], ['spectacles'], ['eyeglasses']])('%s means glasses', (text) => {
      expect(cfg(text).glasses).not.toBe('none')
    })

    it.each([['beanie'], ['woolly hat'], ['wool hat'], ['bobble hat']])('%s means a beanie', (text) => {
      expect(cfg(text).headwear).toBe('beanie')
    })

    it.each([['jumper'], ['sweater'], ['top'], ['t shirt'], ['tee'], ['jersey']])(
      '%s names the shirt for a colour',
      (noun) => {
        expect(cfg(`a purple ${noun}`).shirt).toBe('#8a46a8')
      },
    )
  })

  describe('negation', () => {
    it('removes glasses asked for elsewhere in the sentence', () => {
      expect(cfg('round glasses').glasses).toBe('round')
      expect(cfg('no glasses').glasses).toBe('none')
    })

    it.each([
      ['no glasses'], ['without glasses'], ['not wearing glasses'], ['sans glasses'],
    ])('%s turns the glasses off', (text) => {
      expect(cfg(text).glasses).toBe('none')
    })

    it('removes a beard, a hat and the hair', () => {
      expect(cfg('no beard').facialHair).toBe('none')
      expect(cfg('without a hat').headwear).toBe('none')
      expect(cfg('no hair').hairStyle).toBe('none')
    })

    it('turns the blush off', () => {
      expect(cfg('no blush').blush).toBe(false)
    })

    it('counts the negated phrase as recognised, not as skipped', () => {
      const result = describeToConfig('no glasses')
      expect(result.matched).toContain('glasses')
      expect(result.ignored).toEqual([])
    })

    it('leaves a later mention standing, because the last word wins', () => {
      expect(cfg('no glasses but actually round glasses').glasses).toBe('round')
    })

    it('does nothing when the negated phrase has nothing to turn off', () => {
      expect(cfg('no oval face').faceShape).toBe('oval')
    })
  })

  describe('multi-word precedence', () => {
    it('prefers the longer phrase over either of its words', () => {
      expect(cfg('hard hat').headwear).toBe('hardHat')
      expect(cfg('straw hat').headwear).toBe('strawHat')
      expect(cfg('hat').headwear).toBe('cap')
    })

    it('reads a modifier and a colour as one colour', () => {
      expect(cfg('light blue shirt').shirt).not.toBe(cfg('blue shirt').shirt)
      expect(cfg('dark blue shirt').shirt).not.toBe(cfg('blue shirt').shirt)
    })

    it('reads a three-word colour', () => {
      expect(cfg('very dark green shirt').shirt).not.toBe(cfg('dark green shirt').shirt)
    })

    it('keeps "square glasses" from being read as a square face', () => {
      const result = cfg('square glasses')
      expect(result.glasses).toBe('square')
      expect(result.faceShape).toBe(DEFAULT_CONFIG.faceShape)
    })
  })

  describe('colour targeting', () => {
    it('attaches a colour to the noun that follows it', () => {
      const result = cfg('green hair, blue shirt')
      expect(result.hairColor).toBe('#3f9e5a')
      expect(result.shirt).toBe('#3f6fb5')
    })

    it('reads "red hair" as ginger rather than as a red crayon', () => {
      expect(cfg('red hair').hairColor).toBe('#c4572a')
    })

    it('attaches a colour to the noun before it when nothing follows', () => {
      expect(cfg('hair, dark brown').hairColor).not.toBe(DEFAULT_CONFIG.hairColor)
    })

    it('puts a colour with nothing to attach to on the shirt', () => {
      expect(cfg('orange').shirt).toBe('#ec7a2a')
    })

    it('puts a second unattached colour on the accents', () => {
      const result = cfg('orange and teal')
      expect(result.shirt).toBe('#ec7a2a')
      expect(result.accent).toBe('#2f8f8f')
    })

    it('colours the glasses, the hat and the beard separately', () => {
      const result = cfg('gold glasses, a red cap and a white beard')
      expect(result.glassesColor).toBe('#e0b23a')
      expect(result.headwearColor).toBe('#d23b3b')
      expect(result.facialHairColor).toBe('#f7f4fa')
    })
  })

  /**
   * A colour standing in front of a word belongs to that word.
   *
   * "short beard, white collar" used to produce a white beard: the collar names
   * a shape rather than a colour, so the colour reached backwards and found the
   * beard. Read aloud, nobody would ever mean that.
   */
  describe('a colour never reaches backwards past the noun it was written in front of', () => {
    it('leaves the beard alone when the white belongs to the collar', () => {
      const result = cfg('short beard, white collar')
      expect(result.facialHair).toBe('beard')
      expect(result.facialHairColor).toBe(DEFAULT_CONFIG.facialHairColor)
      expect(result.neckline).toBe('collar')
      expect(result.accent).toBe('#f7f4fa')
    })

    it('reads the whole sentence that found it', () => {
      const result = cfg('short black hair, short beard, brown skin, black blazer, white collar')
      expect(result.facialHairColor).toBe(DEFAULT_CONFIG.facialHairColor)
      expect(result.hairColor).toBe('#1e1b24')
      expect(result.skin).toBe('#8a5a38')
      expect(result.shirt).toBe('#22232a')
      expect(result.accent).toBe('#f7f4fa')
      expect(result.facialHair).toBe('beard')
    })

    it('still colours the beard when the beard is what was named', () => {
      expect(cfg('short beard, white beard').facialHairColor).toBe('#f7f4fa')
      expect(cfg('a grey moustache').facialHairColor).toBe('#9aa0a8')
    })

    it('puts a colour in front of a shape-only word onto the shirt', () => {
      expect(cfg('a beard and a navy v neck').shirt).toBe('#22365e')
      expect(cfg('a beard and a navy v neck').facialHairColor).toBe(DEFAULT_CONFIG.facialHairColor)
    })

    it('still lets a trailing colour find the noun before it', () => {
      expect(cfg('hair, dark brown').hairColor).not.toBe(DEFAULT_CONFIG.hairColor)
      expect(cfg('beard, silver').facialHairColor).toBe('#c3c9d0')
    })

    it('leaves the shirt alone when only the collar was coloured', () => {
      expect(cfg('white collar').shirt).toBe(DEFAULT_CONFIG.shirt)
    })
  })

  describe('garments', () => {
    it.each([
      ['blazer'], ['jacket'], ['coat'], ['suit'], ['cardigan'], ['waistcoat'], ['vest'], ['uniform'],
      ['overalls'], ['pullover'], ['dress'], ['tee'], ['t shirt'], ['jersey'],
    ])('%s is a word it knows, not a word it skips', (word) => {
      const result = describeToConfig(`a teal ${word}`)
      expect(result.ignored).toEqual([])
      expect(result.config.shirt).toBe('#2f8f8f')
    })

    it('gives a jacket a collar, since that is what one has', () => {
      expect(cfg('a black jacket').neckline).toBe('collar')
    })

    it('colours a hoodie in both the places a hoodie is', () => {
      const result = cfg('a red hoodie')
      expect(result.headwear).toBe('hood')
      expect(result.headwearColor).toBe('#d23b3b')
      expect(result.shirt).toBe('#d23b3b')
    })

    it('colours the stripes rather than the whole shirt', () => {
      const result = cfg('a blue shirt with red stripes')
      expect(result.shirt).toBe('#3f6fb5')
      expect(result.shirtDetail).toBe('stripe')
      expect(result.accent).toBe('#d23b3b')
    })
  })

  describe('what it does not understand', () => {
    it('lists the words it could not place', () => {
      const result = describeToConfig('a brave llama riding a skateboard')
      expect(result.ignored).toContain('llama')
      expect(result.ignored).toContain('skateboard')
      expect(result.ignored).toContain('brave')
      expect(result.ignored).toContain('riding')
    })

    it('does not list the small words that carry no meaning here', () => {
      const result = describeToConfig('a person with the glasses and a hat')
      expect(result.ignored).toEqual([])
    })

    it('leaves the default character when it understands nothing', () => {
      const result = describeToConfig('xyzzy plugh frotz')
      expect(result.config).toEqual(DEFAULT_CONFIG)
      expect(result.matched).toEqual([])
      expect(result.ignored).toEqual(['xyzzy', 'plugh', 'frotz'])
    })

    it('lists each unknown word once', () => {
      const result = describeToConfig('llama llama llama')
      expect(result.ignored).toEqual(['llama'])
    })
  })

  describe('awkward input', () => {
    it('survives a very long description and still reads the parts it knows', () => {
      const result = describeToConfig(`red beanie ${'blah '.repeat(400)}`)
      expect(result.config.headwear).toBe('beanie')
      expect(result.ignored.length).toBeLessThan(20)
    })

    it('caps how much text it will consider at all', () => {
      const result = describeToConfig(`${'x'.repeat(5000)} beanie`)
      expect(result.config.headwear).toBe('none')
    })

    it('ignores case and punctuation', () => {
      expect(cfg('ROUND Glasses!!').glasses).toBe('round')
      expect(cfg('v-neck').neckline).toBe('v')
    })

    it('reads other scripts as words it does not know', () => {
      const result = describeToConfig('beanie привет')
      expect(result.config.headwear).toBe('beanie')
      expect(result.matched).toEqual(['beanie'])
    })

    it('handles a description that is only a negation', () => {
      expect(describeToConfig('no').config).toEqual(DEFAULT_CONFIG)
    })
  })
})
