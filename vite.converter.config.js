import { defineConfig } from 'vite';

export default defineConfig({
  root: 'tools/converter-src',
  publicDir: 'public',
  base: '/tools/converter/',
  build: {
    outDir: '../converter',
    emptyOutDir: true,
  },
});
