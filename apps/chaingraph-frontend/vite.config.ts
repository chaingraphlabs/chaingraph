/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import path from 'node:path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3004,
  },
  plugins: [
    nodePolyfills({
      include: ['buffer', 'crypto', 'path'],
      exclude: ['fs', 'os', 'stream', 'vm'],
      globals: {
        global: true,
        Buffer: true,
        process: true,
      },
      protocolImports: true,
      overrides: {
        fs: 'rollup-plugin-node-polyfills/polyfills/empty',
        os: 'rollup-plugin-node-polyfills/polyfills/empty',
        stream: 'rollup-plugin-node-polyfills/polyfills/empty',
        vm: 'rollup-plugin-node-polyfills/polyfills/empty',
      },
    }),
    react({
      tsDecorators: true,
      plugins: [
        ['@effector/swc-plugin', {}],
      ],
    }),
    tsconfigPaths({
      configNames: ['tsconfig.json', 'tsconfig.app.json'],
    }),
    svgr({
      include: ['**/*.svg'],
      svgrOptions: {
        icon: true,
        typescript: true,
        ref: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
      'vite-plugin-node-polyfills/shims/buffer': path.resolve(
        __dirname,
        'node_modules',
        'vite-plugin-node-polyfills',
        'shims',
        'buffer',
        'dist',
        'index.cjs',
      ),
      'vite-plugin-node-polyfills/shims/global': path.resolve(
        __dirname,
        'node_modules',
        'vite-plugin-node-polyfills',
        'shims',
        'global',
        'dist',
        'index.cjs',
      ),
      'vite-plugin-node-polyfills/shims/process': path.resolve(
        __dirname,
        'node_modules',
        'vite-plugin-node-polyfills',
        'shims',
        'process',
        'dist',
        'index.cjs',
      ),
      // Polyfill Node.js modules that cannot run in browser
      'node:fs': 'rollup-plugin-node-polyfills/polyfills/empty',
      'node:os': 'rollup-plugin-node-polyfills/polyfills/empty',
      'node:path': 'path-browserify',
      'fs': 'rollup-plugin-node-polyfills/polyfills/empty',
      'os': 'rollup-plugin-node-polyfills/polyfills/empty',
    },
  },
  optimizeDeps: {
    include: ['superjson'],
    exclude: ['reflect-metadata'],
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      external: [
        // Node.js modules that should not be bundled for browser
        'node:fs',
        'node:os',
        'node:path',
        'fs',
        'os',
        'stream',
        'vm',
      ],
    },
  },
})
