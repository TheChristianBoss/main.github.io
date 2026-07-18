import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The unified build coordinator overrides outDir with a staging directory,
// verifies the result, then promotes ats-index.html to tools/ats/index.html.
export default defineConfig({
  plugins: [react()],
  base: '/tools/ats/',
  build: {
    outDir: process.env.CG_BUILD_OUT_DIR || 'tools/ats',
    emptyOutDir: Boolean(process.env.CG_BUILD_OUT_DIR),
    rollupOptions: {
      input: 'ats-index.html',
    },
  },
})
