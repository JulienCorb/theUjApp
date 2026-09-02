import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      emitTsDeclarations: true,
      emitGitIgnore: false,
      outputStructure: 'locale-modules',
    }),
    viteReact(),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
})

export default config
