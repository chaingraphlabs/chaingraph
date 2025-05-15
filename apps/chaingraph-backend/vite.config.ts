/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { defineConfig } from 'vite'

export default defineConfig({
  // resolve: {
  //   alias: {
  //     ws: './node_modules/ws/index.js',
  //   },
  // },
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
