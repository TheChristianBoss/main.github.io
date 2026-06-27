import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'tools/converter-src',
  plugins: [react()],
  publicDir: false,
  base: '/tools/converter/',
  build: {
    outDir: '../converter',
    emptyOutDir: true,
  },
});
