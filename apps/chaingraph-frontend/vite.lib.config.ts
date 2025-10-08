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
      // Remove @effector/swc-plugin to avoid transforming external effector imports
      plugins: [],
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
    minify: 'esbuild',
    sourcemap: true,
    cssCodeSplit: false,
    cssMinify: true,
    outDir: 'dist/lib',
    emptyOutDir: true, // Clean dist folder before build
    lib: {
      entry: 'src/exports.tsx',
      formats: ['es'],
      fileName: 'chaingraph-frontend',
    },
    rollupOptions: {
      external: [
        '@xyflow/react',
        '@xyflow/system',
        'react',
        'react-dom',
        'react/jsx-runtime',
        'superjson',
        'wagmi',
        'viem',
        '@trpc/client',
        '@trpc/react-query',
        '@trpc/server',
        '@trpc/tanstack-react-query',
      ],
      output: {
        assetFileNames: 'chaingraph-frontend.css',
        interop: 'esModule',
        inlineDynamicImports: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'superjson',
      '@xyflow/react',
      '@xyflow/system',
      'lucide-react',
      'wagmi',
      'viem',
    ],
    esbuildOptions: {
      // Keep names to avoid minification causing issues
      keepNames: true,
    },
  },
})
