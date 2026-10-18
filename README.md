# Mascotry

Design a friendly mascot, drop it on your page, and watch it follow the reader's
cursor. Poke it and it reacts.

Everything runs in the browser. No account, no server, no API key, no cost — and
no requests to anywhere but the page itself, which the end-to-end suite checks
rather than assumes.

## How it works

A character is described by a small config: face shape, ears, hair, eyes,
glasses, facial hair, headwear and colours. From that config the studio draws
two sprite sheets, each a 3x3 grid:

- **Poses** — nine head directions, from up-left to down-right.
- **Moods** — nine expressions, from a blink to a dizzy spin.

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
```

Deploy `dist/` to any static host.

## Layout

| Path | What |
|---|---|
| `src/studio` | The drawing rig: parts, poses, colour handling, sheet rendering |
| `src/runtime` | The `<Mascot>` component, the `<mascotry-mascot>` element, and the pointer and poke logic both share |
| `src/image` | The pixel buffer type shared by the drawing code |
| `src/app` | The web app: pick a character, tune it, preview it, export it |
| `src/demo` | A made-up allotment association's site, running the real shipped element |
| `e2e` | Playwright: no console errors, no outside requests, real downloads, screenshots at three widths in both themes |

## Licence

MIT, © 2026 LihanCanCode. All code and artwork in this repository is original
work written for this project; it carries no third-party code or assets.
