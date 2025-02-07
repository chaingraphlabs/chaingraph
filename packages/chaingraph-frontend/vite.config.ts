import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { version: '2023-11' }],
        ],
      },
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
  resolve: {
    alias: {
      '@badaitech/chaingraph-types': resolve(__dirname, '../chaingraph-types/src'),
      '@badaitech/chaingraph-nodes': resolve(__dirname, '../chaingraph-nodes/src'),
      '@badaitech/chaingraph-backend': resolve(__dirname, '../chaingraph-backend/src'),
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['@badaitech/chaingraph-types', '@badaitech/chaingraph-nodes', '@badaitech/chaingraph-backend', 'superjson'],
    exclude: ['reflect-metadata'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
