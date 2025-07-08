import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Challenge-Month1/week1/',  // caminho que será usado no GitHub Pages
  build: {
    outDir: '../docs/week1',         // saída do build
    emptyOutDir: true,               // limpa a pasta antes
  },
});