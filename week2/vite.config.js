import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Challenge-Month1/week2/',  // caminho que será usado no GitHub Pages
  build: {
    outDir: '../docs/week2',         // saída do build
    emptyOutDir: true,               // limpa a pasta antes
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})
