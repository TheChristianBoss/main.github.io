import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds the ATS Checker into tools/ats/, matching the site's live URL
// structure. `base` is set so generated asset URLs resolve correctly when
// served from /tools/ats/ instead of the site root.
export default defineConfig({
  plugins: [react()],
  base: '/tools/ats/',
  build: {
    outDir: 'tools/ats',
    emptyOutDir: false, // preserve favicon.svg / icons.svg already in tools/ats/
    rollupOptions: {
      input: 'ats-index.html',
    },
  },
})
