// import { resolve } from 'node:path'
// import { defineConfig } from 'vite'
// import svgr from 'vite-plugin-svgr'
//
// export default defineConfig({
//   build: {
//     lib: {
//       entry: resolve(__dirname, 'src/index.ts'),
//       name: 'chaingraph-nodes',
//       formats: ['es'],
//       fileName: 'index',
//     },
//     rollupOptions: {
//       external: [
//         'react',
//         '@badaitech/chaingraph-types',
//         '@badaitech/chaingraph-types/*',
//         '@langchain/openai',
//         'langchain',
//         'lucide-react',
//         /^@chaingraph\/types\/.*/,
//       ],
//       output: {
//         preserveModules: true,
//         preserveModulesRoot: 'src',
//       },
//     },
//     sourcemap: true,
//     outDir: 'dist',
//   },
//   plugins: [
//     svgr(),
//   ],
// })
