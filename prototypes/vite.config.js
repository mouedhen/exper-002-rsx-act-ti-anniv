import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Un point d'entrée par concept ; le build produit un dossier statique qui tourne hors ligne (D-051).
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        a: resolve(import.meta.dirname, 'concept-a/index.html'),
        b: resolve(import.meta.dirname, 'concept-b/index.html'),
        c: resolve(import.meta.dirname, 'concept-c/index.html'),
        combi: resolve(import.meta.dirname, 'concept-combi/index.html'),
      },
    },
  },
})
