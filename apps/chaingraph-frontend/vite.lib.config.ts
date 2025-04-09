/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ['buffer', 'crypto', 'path'],
      globals: {
        global: true,
        Buffer: true,
        process: true,
      },
      protocolImports: true,
    }),
    react({
      tsDecorators: true,
    }),
    tsconfigPaths(),
    svgr({
      include: ['**/*.svg'],
      svgrOptions: {
        icon: true,
        typescript: true,
        ref: true,
      },
    }),
  ],
  optimizeDeps: {
    include: ['superjson'],
    exclude: ['reflect-metadata'],
  },
  build: {
    sourcemap: true,
    outDir: 'dist/lib',
    lib: {
      entry: 'src/exports.tsx',
      name: 'ChainGraphFrontend',
      formats: ['es', 'cjs'],
      fileName: format => `chaingraph-frontend.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@badaitech/chaingraph-types',
        '@badaitech/chaingraph-nodes',
        '@badaitech/chaingraph-trpc',
        '@badaitech/badai-api',
        // 'vite-plugin-node-polyfills/shims/global',
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          '@badaitech/chaingraph-types': 'ChainGraphTypes',
          '@badaitech/chaingraph-nodes': 'ChainGraphNodes',
          '@badaitech/chaingraph-trpc': 'ChainGraphTRPC',
          '@badaitech/badai-api': 'BadAIApi',
        },
      },
    },
  },
})
