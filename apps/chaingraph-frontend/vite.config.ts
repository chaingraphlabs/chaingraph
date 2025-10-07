/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import circularDependency from 'vite-plugin-circullar-dependency'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3004,
  },
  css: {
    devSourcemap: true, // Enable CSS source maps for debugging styles
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
    circularDependency({
      include: /src/,
      exclude: /node_modules/,
      failOnError: true,
      allowAsyncCycles: false,
      cwd: process.cwd(),
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
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
    // exclude: ['reflect-metadata'],
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
