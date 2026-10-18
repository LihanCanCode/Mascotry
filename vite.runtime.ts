/**
 * Emits the two runtime files the app hands out as downloads.
 *
 * They have to be real, self-contained ES modules at stable paths: the export
 * panel links straight to them, the demo page tells people to copy them, and a
 * snippet that names a hashed asset would be useless. Rolling them up with the
 * app would also split `aim` and `poke` into a shared chunk, which is fine for
 * the app and wrong for a file somebody downloads. So each one is bundled on
 * its own, from the same sources the app previews with, and served at the same
 * path in dev as in a build.
 */
import { build } from 'esbuild'
import type { Plugin } from 'vite'

interface RuntimeFile {
  readonly name: string
  readonly entry: string
  /** Left for the host project to resolve. */
  readonly external: readonly string[]
}

export const RUNTIME_FILES: readonly RuntimeFile[] = [
  { name: 'mascotry-mascot.js', entry: 'src/runtime/mascotry-element.ts', external: [] },
  { name: 'mascotry-react.js', entry: 'src/runtime/react-entry.ts', external: ['react', 'react/jsx-runtime'] },
]

const BANNER = '/* Mascotry runtime. MIT, (c) 2026 LihanCanCode. */'

async function bundle(file: RuntimeFile): Promise<string> {
  const result = await build({
    entryPoints: [file.entry],
    bundle: true,
    write: false,
    format: 'esm',
    target: 'es2022',
    jsx: 'automatic',
    external: [...file.external],
    banner: { js: BANNER },
    legalComments: 'none',
  })
  const output = result.outputFiles[0]
  if (output === undefined) throw new Error(`esbuild produced nothing for ${file.entry}`)
  return output.text
}

export function runtimeFiles(): Plugin {
  return {
    name: 'mascotry:runtime-files',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = (request.url ?? '').split('?')[0]
        const match = RUNTIME_FILES.find((file) => path === `/${file.name}`)
        if (match === undefined) {
          next()
          return
        }
        bundle(match).then(
          (code) => {
            response.setHeader('Content-Type', 'text/javascript; charset=utf-8')
            response.end(code)
          },
          (error: unknown) => next(error),
        )
      })
    },
    async generateBundle() {
      for (const file of RUNTIME_FILES) {
        this.emitFile({ type: 'asset', fileName: file.name, source: await bundle(file) })
      }
    },
  }
}
