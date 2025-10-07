/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import * as path from 'node:path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
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
      configNames: ['tsconfig.json', 'tsconfig.lib.json'],
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
  css: {
    postcss: './postcss.lib.config.js',
    // Disable modules to keep class names intact
    modules: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Polyfill Node.js modules that cannot run in browser
      'node:fs': 'rollup-plugin-node-polyfills/polyfills/empty',
      'node:os': 'rollup-plugin-node-polyfills/polyfills/empty',
      'node:path': 'path-browserify',
      'fs': 'rollup-plugin-node-polyfills/polyfills/empty',
      'os': 'rollup-plugin-node-polyfills/polyfills/empty',
    },
  },
  build: {
    minify: false,
    sourcemap: true,
    cssCodeSplit: false,
    cssMinify: true,
    outDir: 'dist/lib',
    lib: {
      entry: 'src/exports.tsx',
      name: 'ChainGraphFrontend', // Used for UMD/IIFE bundles
      formats: ['es', 'umd'],
      fileName: format => `chaingraph-frontend.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      // Only keep React and ReactDOM as external dependencies
      external: [
        'superjson',
        'react',
        'react-dom',
      ],
      output: {
        // Bundle everything else together
        globals: {
          'superjson': 'SuperJSON',
          'react': 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: 'chaingraph-frontend.css',
      },
    },
    commonjsOptions: {
      // This helps with CommonJS dependencies
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Don't empty outDir to preserve app build
    emptyOutDir: false,
  },
  optimizeDeps: {
    include: [
      'superjson',
      'react',
      'react-dom',
    ],
    esbuildOptions: {
      // Keep names to avoid minification causing issues
      keepNames: true,
    },
  },
})
