import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/bible/',
  build: {
    rollupOptions: {
      external: [],
    },
  },
  assetsInclude: [],
  optimizeDeps: {
    exclude: [],
  },
  json: {
    stringify: true,
  











},

})

