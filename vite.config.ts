import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

// `VITE_BASE` est posé par la CI pour le deploiement GitHub Pages (/mandarine/).
// En local on sert a la racine.
const base = process.env['VITE_BASE'] ?? '/'

export default defineConfig({
  base,
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Mandarine - chinois jusqu’au HSK 3',
        short_name: 'Mandarine',
        description:
          'Apprentissage du chinois mandarin pour francophones, des premiers tons au HSK 3.',
        lang: 'fr',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0d12',
        theme_color: '#0b0d12',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,woff2,png,svg}'],
        // Les 655 fichiers de traces pesent 3 Mo : les precharger ferait
        // grossir l'installation pour des caracteres qu'on ne consultera
        // peut-etre jamais. Ils sont mis en cache a la premiere consultation.
        globIgnores: ['**/content/hanzi/u*.json'],
        // Le contenu pedagogique est volumineux : on le met en cache a la demande.
        runtimeCaching: [
          {
            urlPattern: /\/content\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'mandarine-content' },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Seuil uniquement sur la logique pedagogique : c'est elle qui doit etre prouvee.
      include: ['src/domain/**/*.ts'],
      exclude: ['src/domain/**/*.test.ts', 'src/domain/**/index.ts'],
      // Le seuil de branches est plus bas que les autres, et c'est voulu.
      // `noUncheckedIndexedAccess` oblige a ecrire un repli sur chaque acces
      // indexe (`tableau[i] ?? 0`). Ces replis sont inatteignables par
      // construction : l'indice est toujours valide. Ils comptent pourtant
      // comme des branches non couvertes. Exiger 85 % reviendrait a se battre
      // contre le systeme de types plutot qu'a tester davantage. Les seuils
      // qui comptent vraiment, lignes et instructions, restent a 90 %.
      thresholds: { lines: 90, functions: 90, branches: 80, statements: 90 },
    },
  },
})
