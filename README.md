# Mascotry

Design a friendly mascot, drop it on your page, and watch it follow the reader's
cursor. Poke it and it reacts.

Everything runs in the browser. No account, no server, no API key, no cost — and
no requests to anywhere but the page itself, which the end-to-end suite checks
rather than assumes.

## Three ways to start one

Equal doors into the same studio. Whatever you start, you can finish any other
way, because all three produce the same small config.

- **Pick one** — 57 characters as a grid of thumbnails, each drawn as you scroll.
- **Describe it** — type "curly dark hair, round glasses, short beard, green
  jumper, brown skin" and get it. A deterministic phrase table, not a model:
  it matches the longest phrase it knows, understands "no glasses", and tells
  you which of your words it did not recognise instead of guessing at them.
- **From a photo** — drop in a head-and-shoulders photo and get a cartoon that
  shares your colouring and features. The file is decoded by the browser's own
  image decoder and read off a canvas in this tab; it is not uploaded and not
  kept, which the end-to-end suite checks by failing on any off-origin request.
  Every field comes with a confidence, only confident fields are applied, and
  each one can be overridden. It wants one face filling much of the frame
  against a plain background: skin is found by its colour, and warm wood, beige
  walls and sand are the same colour as skin, so a photo of a room gets an
  honest "no face found" rather than a brown blob. Eye colour is not read at
  all: without facial landmarks there is nothing to measure.

## How it works

A character is described by a small config: face shape, ears, hair, eyes,
glasses, facial hair, headwear and colours. From that config the studio draws
two sprite sheets, each a 3x3 grid:

- **Poses** — nine head directions, from up-left to down-right.
- **Moods** — nine expressions, from a blink to a dizzy spin.

Each form is painted with a radial light model rather than a flat fill: a key light off the
upper left gives a broad lit side, a soft terminator and a warm bounce in the shadow, with
contact shadows where parts meet and a thin rim on the lit edge. Outlines are tinted dark
versions of the colour they enclose, so an orange fox gets a warm brown line and a grey cat a
cool one. Metal takes a harder specular and a cooler bounce than fur. The `shading`, `rimLight`,
`lineTint`, `edgeTexture` and `material` config keys turn each of those down or off.

The torso is drawn once and reused across all eighteen cells, so the body never
shifts while the head turns. At runtime the component measures where the pointer
sits relative to the mascot, picks a cell, and moves the background. Two image
loads, no per-frame layout.

## Use it

Two runtime files ship, both built from the same sources. Take whichever fits.

### Any page

```html
<script type="module" src="/mascotry-mascot.js"></script>

<mascotry-mascot
  directions="/pip-directions.webp"
  reactions="/pip-reactions.webp"
  size="128"
  label="Pip"></mascotry-mascot>
```

A custom element: shadow DOM, no dependencies, no build step, and it works under
a strict Content-Security-Policy because it never writes stylesheet text.

| Attribute | Meaning |
|---|---|
| `directions` | The 3x3 poses sheet |
| `reactions` | The 3x3 moods sheet |
| `size` | Edge in pixels (default 128) |
| `label` | What a screen reader calls it |
| `commit` / `release` | How far the pointer travels before the head turns, and before it straightens |

### React

```tsx
import { Mascot } from 'mascotry'

<Mascot directions="/pip-directions.webp" reactions="/pip-reactions.webp" label="Pip" />
```

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:5173, plus /demo.html
pnpm test         # unit tests
pnpm test:cov     # with coverage
pnpm typecheck
pnpm build        # static site in dist/
pnpm test:e2e     # builds, serves, and drives a real browser
pnpm shots out/x  # contact sheets and zooms of every preset, for looking at the art
```

Deploy `dist/` to any static host.

## Layout

| Path | What |
|---|---|
| `src/studio` | The drawing rig: parts, poses, colour handling, sheet rendering |
| `src/runtime` | The `<Mascot>` component, the `<mascotry-mascot>` element, and the pointer and poke logic both share |
| `src/image` | The pixel buffer type shared by the drawing and reading code |
| `src/describe` | Words to a character: the phrase vocabulary and the parser |
| `src/photo` | A photo to a character: face finding, colour and feature reading, and the decode |
| `src/app` | The web app: pick a character, tune it, preview it, export it |
| `src/demo` | A made-up allotment association's site, running the real shipped element |
| `e2e` | Playwright: no console errors, no outside requests, real downloads, screenshots at three widths in both themes |

## Licence

MIT, © 2026 LihanCanCode. All code and artwork in this repository is original
work written for this project; it carries no third-party code or assets.
