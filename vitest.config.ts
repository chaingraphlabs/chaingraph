import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['reflect-metadata'],
    alias: {
      '@chaingraph/types': resolve(__dirname, './packages/chaingraph-types/src'),
      '@chaingraph/backend': resolve(__dirname, './packages/chaingraph-backend/src'),
      '@chaingraph/frontend': resolve(__dirname, './packages/chaingraph-frontend/src'),
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        isolate: false,
      },
    },
    deps: {
      optimizer: {
      },
    },
  },
  resolve: {
    alias: {
      '@chaingraph/types': resolve(__dirname, './packages/chaingraph-types/src'),
      '@chaingraph/backend': resolve(__dirname, './packages/chaingraph-backend/src'),
      '@chaingraph/frontend': resolve(__dirname, './packages/chaingraph-frontend/src'),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
})
