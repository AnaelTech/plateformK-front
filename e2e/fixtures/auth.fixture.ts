import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authDir = path.join(__dirname, '../../playwright/.auth');
const authFile = path.join(authDir, 'user.json');
const unavailableMarker = path.join(authDir, '.unavailable');

/**
 * Indique si une session authentifiée a été obtenue par le projet `setup`.
 * Le fichier marqueur `.unavailable` est écrit par `auth.setup.ts` lorsque la
 * connexion échoue (backend indisponible, identifiants invalides...).
 */
export function hasStoredAuth(): boolean {
  return fs.existsSync(authFile) && !fs.existsSync(unavailableMarker);
}

/**
 * `test` étendu : toute suite l'important est automatiquement ignorée lorsque
 * l'authentification n'est pas disponible, plutôt que d'échouer en cascade.
 */
export const test = base.extend<{ authGuard: void }>({
  authGuard: [
    async ({}, use, testInfo) => {
      testInfo.skip(
        !hasStoredAuth(),
        'Authentification indisponible (backend requis) : suite ignorée.',
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };
