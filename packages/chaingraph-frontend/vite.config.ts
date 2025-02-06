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
      '@chaingraph/types': resolve(__dirname, '../chaingraph-types/src'),
      '@chaingraph/nodes': resolve(__dirname, '../chaingraph-nodes/src'),
      '@chaingraph/backend': resolve(__dirname, '../chaingraph-backend/src'),
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['@chaingraph/types', '@chaingraph/nodes', '@chaingraph/backend', 'superjson'],
    exclude: ['reflect-metadata'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
