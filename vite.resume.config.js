import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds the Resume Builder bundle into tools/resume/ for /tools/resume/.
// Vite emits resume-index.html because the source HTML is resume-index.html;
// after building, copy tools/resume/resume-index.html to tools/resume/index.html
// and remove the temporary resume-index.html before deploying.
export default defineConfig({
  plugins: [react()],
  base: '/tools/resume/',
  build: {
    outDir: 'tools/resume',
    emptyOutDir: false,
    rollupOptions: {
      input: 'resume-index.html',
    },
  },
})
