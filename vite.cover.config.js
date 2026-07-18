import { defineConfig } from 'vite'

export default defineConfig({
  root: 'tools/cover-src',
  base: '/tools/cover/',
  build: {
    outDir: process.env.CG_BUILD_OUT_DIR || '../cover',
    emptyOutDir: true,
  },
})
