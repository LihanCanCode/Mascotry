/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { runtimeFiles } from './vite.runtime'

export default defineConfig({
  plugins: [react(), runtimeFiles()],
  build: { rollupOptions: { input: { main: 'index.html', demo: 'demo.html' } } },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60_000,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/studio/**', 'src/runtime/**', 'src/app/**'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/studio/testCanvas.ts',
        'src/app/testDom.ts',
        'src/app/main.tsx',
        'src/app/render/render.worker.ts',
      ],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
})
