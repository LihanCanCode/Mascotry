/**
 * The messages that cross between the page and the render worker.
 *
 * Kept in their own module so neither side has to import the other: the worker
 * does not want React, and the page does not want to pull the worker's module
 * graph just to name a message.
 */
import type { StudioConfig } from '../../studio'
import type { SheetMime } from '../state/reducer'

export interface RenderRequest {
  /** The state revision this render is for; the answer carries it back. */
  readonly id: number
  readonly config: StudioConfig
  /** Edge of one pose in pixels. The sheet comes out three times this. */
  readonly cell: number
}

export type RenderResponse =
  | {
      readonly id: number
      readonly ok: true
      readonly directions: Blob
      readonly reactions: Blob
      readonly mime: SheetMime
    }
  | { readonly id: number; readonly ok: false; readonly message: string }
