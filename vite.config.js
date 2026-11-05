import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Relative base so the build works on a GitHub Pages subpath (with hash routing).
export default defineConfig({
  base: './',
  plugins: [vue()],
})
