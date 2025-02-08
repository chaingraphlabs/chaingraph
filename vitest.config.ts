import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['reflect-metadata'],
    alias: {
      '@badaitech/chaingraph-types': resolve(__dirname, './packages/chaingraph-types/src'),
      '@badaitech/chaingraph-backend': resolve(__dirname, './packages/chaingraph-backend/src'),
      '@badaitech/chaingraph-frontend': resolve(__dirname, './packages/chaingraph-frontend/src'),
      '@badaitech/chaingraph-nodes': resolve(__dirname, './packages/chaingraph-nodes/src'),
    },
    isolate: true,
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        isolate: true,
      },
    },
  },
})
