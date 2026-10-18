/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { main: 'index.html', demo: 'demo.html' } } },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60_000,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/studio/**', 'src/runtime/**', 'src/app/**'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', 'src/studio/testCanvas.ts'],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
})
