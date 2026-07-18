import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The unified build coordinator overrides outDir with a staging directory,
// verifies the result, then promotes resume-index.html to tools/resume/index.html.
export default defineConfig({
  plugins: [react()],
  base: '/tools/resume/',
  build: {
    outDir: process.env.CG_BUILD_OUT_DIR || 'tools/resume',
    emptyOutDir: Boolean(process.env.CG_BUILD_OUT_DIR),
    rollupOptions: {
      input: 'resume-index.html',
    },
  },
})
