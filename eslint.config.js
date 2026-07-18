import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist/**',
    '.build-staging/**',
    '.build-backup/**',
    'bible/**',
    'editor/**',
    'tools/ats/**',
    'tools/resume/**',
    'tools/cover/**',
    'tools/converter/**',
    'tools/asset-forge/**',
    '**/node_modules/**',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['tools/converter-src/src/vendor/ffmpeg/ffmpeg/worker.js'],
    languageOptions: {
      globals: globals.worker,
    },
  },
  {
    files: [
      'scripts/**/*.{js,mjs}',
      'tests/**/*.{js,mjs}',
      '**/tests/**/*.{js,mjs}',
      'vite.*.config.js',
      'tools/asset-forge-src/vite.config.js',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
])
