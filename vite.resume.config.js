import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds the Resume Builder into tools/resume/, matching the site's live
// URL structure. `base` is set so generated asset URLs resolve correctly
// when served from /tools/resume/ instead of the site root.
export default defineConfig({
  plugins: [react()],
  base: '/tools/resume/',
  build: {
    outDir: 'tools/resume',
    emptyOutDir: false, // preserve favicon.svg / icons.svg already in tools/resume/
    rollupOptions: {
      input: 'resume-index.html',
    },
  },
})
