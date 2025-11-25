/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    // Force these to be bundled (not external)
    noExternal: [
      'bigint-crypto-utils',
      'uuid',
      'dotenv',
      'superjson',
      'yaml',
      'decimal.js',
      '@mixmark-io/domino',
      '@badaitech/chaingraph-types',
      '@badaitech/chaingraph-nodes',
      '@badaitech/chaingraph-trpc',
    ],
  },
  build: {
    ssr: true,
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        // Node.js built-ins
        /^node:/,
        'assert',
        'buffer',
        'crypto',
        'dns',
        'events',
        'fs',
        'http',
        'https',
        'net',
        'os',
        'path',
        'process',
        'punycode',
        'stream',
        'string_decoder',
        'tls',
        'tty',
        'url',
        'util',
        'zlib',
        // npm dependencies that are ESM-compatible
        'ws',
        'cors',
        'reflect-metadata',
        'zod',
        'zod/v3',
        'zod/v4',
        'zod/v4/core',
        '@trpc/server',
        '@trpc/server/adapters/ws',
      ],
      output: {
        interop: 'auto',
        // Add createRequire for CJS modules that use require() in ESM context
        banner: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
      },
    },
  },
})
