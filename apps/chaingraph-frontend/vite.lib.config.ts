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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
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
        'react',
        'react-dom',
        'react/jsx-runtime',
      ],
      output: {
        // Bundle everything else together
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
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
      '@badaitech/chaingraph',
      '@badaitech/chaingraph',
      '@dnd-kit/core',
      '@fontsource/inter',
      '@fontsource/jetbrains-mono',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-icons',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/themes',
      '@types/color',
      '@xyflow/react',
      '@xyflow/system',
      'add',
      'class-variance-authority',
      'clsx',
      'cmdk',
      'color',
      'effector',
      'effector-react',
      'framer-motion',
      'lucide-react',
      'patronum',
      'react',
      'react-colorful',
      'react-dom',
      'react-json-view-lite',
      'react-number-format',
      'react-router-dom',
      'reflect-metadata',
      'superjson',
      'tailwind-merge',
      'tailwindcss-animate',
      'yaml',
      'zod-to-json-schema',
      // ...add other dependencies you want to pre-bundle
    ],
    esbuildOptions: {
      // Keep names to avoid minification causing issues
      keepNames: true,
    },
  },
})
