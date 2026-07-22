import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/dev/**/*.test.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    // One worker process per test file so module-level singletons (e.g.
    // recoveryBootstrap.ts's in-memory bootstrapPromise) are never
    // accidentally shared or reset across unrelated test files — each file
    // gets its own fresh module registry, mirroring "a fresh process."
    pool: 'forks',
  },
})
