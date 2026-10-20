<div align="center">

# Mascotry

**Draw a mascot that watches the reader.**

A friendly character for the top of your page. It follows the cursor, and it reacts when you poke it.

<img src="docs/images/hero.png" alt="Eight Mascotry characters: a fox, a hooded hacker, a cat, a doctor, a panda, a footballer, a bunny and a chef" width="100%">

<img src="docs/images/demo.gif" alt="A fox mascot turning its head to follow a cursor around it, then blowing a heart, sparkling, grinning and going dizzy as the cursor pokes it four times" width="720">

Free, no account, no API key, nothing uploaded. Every character is drawn by code in your own browser.

</div>

---

## What it is

Pick a character, change its face, and leave with two sprite sheets and the handful of lines that make them follow the cursor. Drop those on any site — React, plain HTML, anything.

There is no service behind this. The drawing happens in your tab, the files are yours, and nothing is sent anywhere.

## How a character is built

Every mascot is two 3×3 sprite sheets. The first holds nine head directions:

<img src="docs/images/sheet-directions.png" alt="A 3x3 sheet of a fox looking up-left, up, up-right, left, straight ahead, right, down-left, down and down-right" width="420">

The second holds nine moods, shown when someone pokes it:

<img src="docs/images/moods.png" alt="A bear blinking, in love, delighted, surprised, starstruck, bashful, sleepy, dizzy and grinning" width="100%">

At runtime the component measures where the pointer sits relative to the mascot and shifts the background to the matching cell. Two image loads, no layout work per frame.

The torso is drawn once and reused across all eighteen cells, so the body never shifts while the head turns.

## Three ways in

**Pick one** of the fifty-seven characters.

**Describe it.** Type `curly dark hair, round glasses, short beard, green jumper` and get that character. It is a plain keyword parser over 344 phrases — no model, no network — and it tells you which of your words it did not understand.

**From a photo.** Drop in a head-and-shoulders photograph and it reads your skin tone, hair colour and style, beard, glasses and shirt colour, each with a confidence. The photo is read in the tab and never uploaded. It wants a plain background: warm wood and beige walls are the same colour as skin, and when it cannot find a face it says so rather than guessing.

All three land in the same controls, so a character begun one way can be finished another.

## The characters

### Animals
<img src="docs/images/animals.png" alt="Fox, bear, cat, bunny, panda, red panda, wolf, koala, squirrel, hamster, otter and mouse" width="100%">

### Professions
<img src="docs/images/professions.png" alt="Twenty-four profession characters including a hacker, farmer, builder, doctor, nurse, engineer, chef and astronaut" width="100%">

### Sports
<img src="docs/images/sports.png" alt="Footballer, cricketer, basketballer, tennis player, runner, boxer, swimmer, cyclist, skater, climber, goalkeeper and umpire" width="100%">

### People
<img src="docs/images/people.png" alt="Eight neutral faces with different hair, skin tones and features" width="100%">

These eight are starting points rather than finished characters — the doorway into the studio.

## Use it

```tsx
import { Mascot } from 'mascotry'

<Mascot directions="/pip-directions.webp" reactions="/pip-moods.webp" label="Pip" />
```

Not using React? The same thing ships as a custom element:

```html
<script type="module" src="/mascotry-mascot.js"></script>
<mascotry-mascot
  directions="/pip-directions.webp"
  reactions="/pip-moods.webp"
  size="140"
  label="Pip"
></mascotry-mascot>
```

Both respect `prefers-reduced-motion`, stay quiet on touch devices where there is no cursor to follow, and work under a strict Content Security Policy.

## Run it

```bash
pnpm install
pnpm dev          # the studio
pnpm test         # 1173 unit and integration tests
pnpm typecheck
pnpm build        # static site in dist/
pnpm e2e          # browser tests
```

`pnpm dev` also serves a demo page at `/demo.html`: a made-up allotment association's website with a mascot on its shelf, built from the same files this repo ships.

Deploy `dist/` to any static host.

## How it is put together

| Path | What |
|---|---|
| `src/studio` | The drawing rig: the 2.5D face projection, the parts, the lighting, the presets |
| `src/runtime` | The `<Mascot>` component, the custom element, and the pointer and poke logic |
| `src/describe` | Words to a character |
| `src/photo` | A photograph to a character |
| `src/app` | The studio itself |
| `docs/roster.md` | What is built, what is planned, and what each character costs to draw |

### A note on the drawing

Characters are not images with the colours swapped. A config describes the face — ears, muzzle, hair, glasses, facial hair, headwear, accessories, colours — and the rig projects the features onto a sphere to turn the head, lights every form from the upper left, derives each outline from the colour it surrounds, and breaks up fur and hair along the silhouette. That is why a character can be recoloured and restyled after you pick it, and why a new one costs a few lines rather than a drawing.

## Known limits

- **Koala, hamster, otter and mouse** look like recoloured bear cubs. The rig has one round ear, and they want their own.
- **Owl, penguin, dog, tiger, deer and the objects** are planned but unbuilt: they need a beak, a snout, droopy ears, markings and a second head shape. `docs/roster.md` lists what each costs.
- **The photo route refuses ordinary snapshots** taken against warm backgrounds. It is honest about it, but a sliding-window face search would fix it.
- Eye colour, glasses shape and a moustache-versus-beard distinction are never guessed from a photo, because none of them can be measured honestly without facial landmarks.

## Licence

MIT, © 2026 LihanCanCode.

Every line of code and every pixel of artwork here is original work written for this project. There is no third-party code and there are no borrowed assets.
