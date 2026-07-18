import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url))
const defaultOutput = path.resolve(sourceDirectory, '../asset-forge')

export default defineConfig({
  plugins: [react()],
  base: '/tools/asset-forge/',
  build: {
    outDir: process.env.CG_BUILD_OUT_DIR || defaultOutput,
    emptyOutDir: true,
  },
})
