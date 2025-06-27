// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'week1',
  base: '/Challenge-Month1/',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})