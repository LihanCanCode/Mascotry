/**
 * The bag "Surprise me" draws from.
 *
 * A bag rather than a random pick: drawing without replacement means pressing
 * the button twice never shows the same description twice, which is the whole
 * point of pressing it twice.
 */

export const EXAMPLE_DESCRIPTIONS: readonly string[] = Object.freeze([
  'curly dark hair, round glasses, short beard, green jumper, brown skin',
  'a grey cat in a red scarf',
  'blonde bun, pale skin, teal turtleneck',
  'a fox with a straw hat and a striped shirt',
  'buzz cut, dark skin, gold glasses, navy v neck',
  'a robot with headphones and an orange badge',
  'ginger ponytail, freckled, mustard jumper',
  'bald, thick eyebrows, hard hat, apron',
  'a white bunny with a lavender scarf and big eyes',
  'olive skin, black hair, surgical cap, no glasses',
  'a bear in a beanie with a mint shirt',
  'long auburn hair, arched brows, plum top, long lashes',
  'square glasses, stubble, charcoal turtleneck, silver accents',
  'hijab, brown skin, crimson jumper, gold trim',
  'a panda with a tie and small eyes',
  'messy blonde hair, visor, lime jersey, headband',
])

/**
 * A new order for `items`, using `random` for every swap.
 *
 * Fisher-Yates, and a copy rather than a sort in place, so the exported list
 * is never the thing being shuffled.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): readonly T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const here = out[i]
    const there = out[j]
    if (here === undefined || there === undefined) continue
    out[i] = there
    out[j] = here
  }
  return out
}

/**
 * The next description and the bag that is left.
 *
 * An empty bag refills itself, so the button never stops working.
 */
export function drawExample(
  bag: readonly string[],
  random: () => number = Math.random,
): { readonly text: string; readonly rest: readonly string[] } {
  const full = bag.length > 0 ? bag : shuffle(EXAMPLE_DESCRIPTIONS, random)
  const [text, ...rest] = full
  return { text: text ?? EXAMPLE_DESCRIPTIONS[0] ?? '', rest }
}
