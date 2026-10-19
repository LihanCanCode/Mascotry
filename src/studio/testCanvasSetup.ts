/**
 * Vitest setup: return the pooled native canvases after every test.
 *
 * See `testCanvas.ts` -- @napi-rs/canvas never frees a Skia surface, so without
 * this the suite allocates its way to the process commit limit and then fails
 * wherever it next happens to draw.
 */
import { afterEach } from 'vitest'
import { releaseTestCanvases } from './testCanvas'

afterEach(releaseTestCanvases)
