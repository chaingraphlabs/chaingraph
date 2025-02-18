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
  },
})
