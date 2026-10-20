/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { runtimeFiles } from './vite.runtime'

// GitHub Pages serves a project site from /<repo>/, so the build needs to know
// its prefix. Unset means the root, which is what a local build and the dev
// server want.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [react(), runtimeFiles()],
  build: { rollupOptions: { input: { main: 'index.html', demo: 'demo.html' } } },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/studio/testCanvasSetup.ts'],
    testTimeout: 60_000,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/studio/**', 'src/runtime/**', 'src/app/**', 'src/describe/**', 'src/photo/**'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/studio/testCanvas.ts',
        'src/studio/testCanvasSetup.ts',
        // The synthetic photographs the photo tests are judged against: test
        // input, not product code.
        'src/photo/fixtures.ts',
        'src/app/testDom.ts',
        'src/app/main.tsx',
        'src/app/render/render.worker.ts',
      ],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
})
