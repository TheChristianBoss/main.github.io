import { defineConfig } from 'vite';

export default defineConfig({
  root: 'tools/cover-src',
  base: '/tools/cover/',
  build: {
    outDir: '../cover',
    emptyOutDir: true,
  },
});
