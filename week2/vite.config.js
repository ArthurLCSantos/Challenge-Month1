import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Challenge-Month-1/week2/', // importante para GitHub Pages
  build: {
    outDir: 'dist', // padrão
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})
