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
    outDir: 'dist',
  },
})
