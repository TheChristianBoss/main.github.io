import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: change `base` below to match your GitHub repo name.
// If your repo URL is https://github.com/yourname/bible-library
// then base should be '/bible/'
// If you deploy to a custom domain or a username.github.io root repo,
// set base to '/'
export default defineConfig({
  plugins: [react()],
  base: '/bible/',
})
