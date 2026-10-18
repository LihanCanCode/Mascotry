# Mascotry

Design a friendly mascot, drop it on your page, and watch it follow the reader's
cursor. Poke it and it reacts.

Everything runs in the browser. No account, no server, no API key, no cost.

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

```tsx
import { Mascot } from 'mascotry'

<Mascot directions="/pip-poses.webp" reactions="/pip-moods.webp" label="Pip" />
```

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # unit tests
pnpm typecheck
pnpm build      # static site in dist/
```

Deploy `dist/` to any static host.

## Layout

| Path | What |
|---|---|
| `src/studio` | The drawing rig: parts, poses, colour handling, sheet rendering |
| `src/runtime` | The `<Mascot>` component and the pointer and poke logic behind it |
| `src/image` | The pixel buffer type shared by the drawing code |
| `src/app` | The web app: pick a character, tune it, export it |

## Licence

MIT, © 2026 LihanCanCode. All code and artwork in this repository is original
work written for this project; it carries no third-party code or assets.
