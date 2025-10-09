/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    dedupe: [
      '@badaitech/badai-api',
      '@badaitech/chaingraph-executor',
      '@badaitech/chaingraph-nodes',
      '@badaitech/chaingraph-trpc',
      '@badaitech/chaingraph-types',
      '@modelcontextprotocol/sdk',
      'superjson',
      'react',
      'react-dom',
      'react/jsx-runtime',
      'wagmi',
      'viem',
      '@xyflow/react',
      '@xyflow/system',
      'ws',
      'pg',
      '@tanstack/react-query',
      '@trpc/client',
      '@trpc/react-query',
      '@trpc/server',
      '@trpc/tanstack-react-query',
      'drizzle-orm',
      'dotenv',
      'nanoid',
      'nanoid-dictionary',
    ],
  },
  build: {
    ssr: true,
    lib: {
      entry: './src/index.ts',
      formats: ['cjs'],
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['bigint-crypto-utils'],
    },
  },
})
