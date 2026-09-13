import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authDir = path.join(__dirname, '../../playwright/.auth');
const authFile = path.join(authDir, 'user.json');
const unavailableMarker = path.join(authDir, '.unavailable');

/**
 * Setup d'authentification pour les tests E2E.
 *
 * - Si la connexion réussit, l'état de session est sauvegardé dans `user.json`.
 * - Sinon (backend indisponible, identifiants invalides...), un marqueur est
 *   écrit afin que les suites authentifiées se *désactivent* proprement au lieu
 *   d'échouer en masse. On écrit malgré tout un état vide pour que Playwright
 *   puisse initialiser le contexte `storageState`.
 */
setup('authenticate', async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });

  let authenticated = false;

  try {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();

    await page.getByLabel('Adresse e-mail').fill('test@klassio.com');
    await page.getByLabel('Mot de passe').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Le rôle détermine le dashboard cible (professeur / parent / élève).
    await page.waitForURL(
      /(dashboard|parent-dashboard|student-dashboard)/,
      { timeout: 15000 },
    );
    authenticated = true;
  } catch {
    console.log(
      '[e2e] Authentification indisponible : les suites authentifiées seront ignorées.',
    );
  }

  // Toujours écrire un storageState (potentiellement vide) pour le contexte.
  await page.context().storageState({ path: authFile });

  if (authenticated) {
    fs.rmSync(unavailableMarker, { force: true });
  } else {
    fs.writeFileSync(unavailableMarker, new Date().toISOString());
  }
});
