import { defineConfig } from 'vite'

export default defineConfig({
  root: 'tools/converter-src',
  publicDir: 'public',
  base: '/tools/converter/',
  build: {
    outDir: process.env.CG_BUILD_OUT_DIR || '../converter',
    emptyOutDir: true,
  },
})
