import { defineConfig } from 'vite';

export default defineConfig({
  root: 'tools/converter-src',
  publicDir: false,
  base: '/tools/converter/',
  build: {
    outDir: '../converter',
    emptyOutDir: true,
  },
});
