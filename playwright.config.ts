import { defineConfig, devices } from '@playwright/test'

/**
 * Tests de bout en bout, sur le **build de production**.
 *
 * Pas sur le serveur de développement : ce qu'on veut éprouver ici, c'est ce
 * qui sera déployé, chargement différé des écrans compris. Les tests unitaires
 * et les tests de composants tournent dans jsdom, qui n'a ni IndexedDB réel,
 * ni chargement de modules, ni service worker. Ces trois choses ne peuvent
 * être vérifiées que dans un vrai navigateur.
 *
 * Un seul navigateur, Chromium : le projet vise un iPhone et un PC Windows,
 * et faire tourner trois moteurs coûterait du temps sans rien apprendre de
 * plus sur une application qui n'emploie aucune API exotique.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: process.env['CI'] !== undefined,
  retries: process.env['CI'] !== undefined ? 1 : 0,
  reporter: process.env['CI'] !== undefined ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Le format sur lequel l'application est réellement utilisée.
      name: 'iphone',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: process.env['CI'] === undefined,
    timeout: 120_000,
  },
})
