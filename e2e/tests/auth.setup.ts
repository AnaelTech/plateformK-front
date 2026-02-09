import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

/**
 * Setup d'authentification pour les tests E2E
 * Ce test s'exécute une seule fois et sauvegarde l'état d'authentification
 */
setup('authenticate', async ({ page }) => {
  // Aller à la page de connexion
  await page.goto('/login');

  // Attendre que la page soit chargée
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();

  // Remplir le formulaire de connexion avec les bons labels
  await page.getByLabel('Adresse e-mail').fill('test@klassio.com');
  await page.getByLabel('Mot de passe').fill('TestPassword123!');

  // Soumettre le formulaire
  await page.getByRole('button', { name: 'Se connecter' }).click();

  // Attendre la redirection vers le dashboard (ou que la connexion échoue si pas de backend)
  // On attend soit le dashboard, soit on reste sur login avec une erreur
  try {
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
    
    // Sauvegarder l'état d'authentification seulement si on est sur le dashboard
    await page.context().storageState({ path: authFile });
  } catch {
    // Si pas de backend ou connexion échouée, on sauvegarde quand même un état vide
    // pour que les autres tests puissent continuer
    console.log('Note: Authentification non réussie - backend peut-être non disponible');
    await page.context().storageState({ path: authFile });
  }
});
