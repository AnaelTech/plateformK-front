import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E de Klassio
 * Intégré avec Angular CLI via playwright-ng-schematics
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Dossier contenant les tests
  testDir: './e2e/tests',

  // Exécuter les tests en parallèle
  fullyParallel: true,

  // Échouer le build si test.only est laissé dans le code source
  forbidOnly: !!process.env['CI'],

  // Nombre de retries en CI
  retries: process.env['CI'] ? 2 : 0,

  // Nombre de workers en parallèle
  workers: process.env['CI'] ? 1 : undefined,

  // Reporter pour les résultats
  reporter: process.env['CI']
    ? [['html', { outputFolder: 'playwright-report' }], ['list'], ['github']]
    : [['html', { outputFolder: 'playwright-report' }], ['list']],

  // Configuration partagée pour tous les projets
  use: {
    // URL de base - sera configurée par ng e2e automatiquement
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] || 'http://localhost:4200',

    // Collecter la trace lors des retries
    trace: 'on-first-retry',

    // Capture d'écran en cas d'échec
    screenshot: 'only-on-failure',

    // Vidéo en cas d'échec
    video: 'on-first-retry',

    // Timeout pour les actions
    actionTimeout: 10000,

    // Timeout pour les navigations
    navigationTimeout: 30000,
  },

  // Timeout global pour chaque test
  timeout: 60000,

  // Timeout pour expect
  expect: {
    timeout: 10000,
  },

  // Configuration des projets (navigateurs)
  projects: [
    // Setup projet pour l'authentification
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Tests Desktop
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Tests Mobile
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Tests sans authentification
    {
      name: 'chromium-no-auth',
      testMatch: /.*\.noauth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Serveur Angular pour les tests E2E
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
  },

  // Dossier pour les fichiers de sortie
  outputDir: 'test-results/',
});
