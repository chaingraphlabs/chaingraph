/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

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
      '@badaitech/chaingraph-trpc': resolve(__dirname, './packages/trpc'),
      '@badaitech/badai-api': resolve(__dirname, './packages/badai-api/src'),
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
