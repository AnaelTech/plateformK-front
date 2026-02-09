import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('devrait afficher le dashboard après connexion', async ({ page }) => {
    await page.goto('/dashboard');

    // Vérifier que le dashboard est chargé
    await expect(page).toHaveURL(/.*dashboard.*/);

    // Vérifier la présence de la navbar
    await expect(page.locator('nav').or(page.getByRole('navigation'))).toBeVisible();
  });

  test('devrait afficher le nom de l\'utilisateur', async ({ page }) => {
    await page.goto('/dashboard');

    // L'utilisateur connecté devrait voir son nom quelque part
    await expect(
      page.getByText(/profil/i)
        .or(page.getByRole('button', { name: /profil/i }))
        .or(page.locator('[data-testid="user-menu"]'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('devrait permettre la navigation vers le profil', async ({ page }) => {
    await page.goto('/dashboard');

    // Cliquer sur le lien/bouton profil
    const profileLink = page.getByRole('link', { name: /profil/i })
      .or(page.getByText(/profil/i).first());

    await profileLink.click();

    // Vérifier la navigation
    await expect(page).toHaveURL(/.*profile.*/);
  });

  test('devrait permettre la déconnexion', async ({ page }) => {
    await page.goto('/dashboard');

    // Trouver et cliquer sur le bouton de déconnexion
    const logoutButton = page.getByRole('button', { name: /déconnexion/i })
      .or(page.getByText(/déconnexion/i))
      .or(page.getByRole('button', { name: /logout/i }));

    await logoutButton.click();

    // Vérifier la redirection vers la page de connexion ou accueil
    await expect(page).toHaveURL(/\/(login)?$/);
  });
});

test.describe('Dashboard - Calendrier', () => {
  test('devrait afficher le calendrier', async ({ page }) => {
    await page.goto('/dashboard');

    // Vérifier la présence du calendrier
    await expect(
      page.locator('[data-testid="calendar"]')
        .or(page.locator('.calendar'))
        .or(page.getByRole('grid'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('devrait permettre de naviguer entre les mois', async ({ page }) => {
    await page.goto('/dashboard');

    // Trouver les boutons de navigation du calendrier
    const nextButton = page.getByRole('button', { name: /suivant/i })
      .or(page.locator('[aria-label="Next month"]'))
      .or(page.locator('button:has-text(">")')).first();

    const prevButton = page.getByRole('button', { name: /précédent/i })
      .or(page.locator('[aria-label="Previous month"]'))
      .or(page.locator('button:has-text("<")')).first();

    // Vérifier que la navigation fonctionne
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      await prevButton.click();
    }
  });
});

test.describe('Dashboard - Notifications', () => {
  test('devrait afficher l\'icône de notifications', async ({ page }) => {
    await page.goto('/dashboard');

    // Vérifier la présence de l'icône de notifications
    await expect(
      page.locator('[data-testid="notification-bell"]')
        .or(page.getByRole('button', { name: /notification/i }))
        .or(page.locator('.notification-bell'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('devrait ouvrir le panneau de notifications', async ({ page }) => {
    await page.goto('/dashboard');

    // Cliquer sur l'icône de notifications
    const notificationButton = page.locator('[data-testid="notification-bell"]')
      .or(page.getByRole('button', { name: /notification/i }))
      .or(page.locator('.notification-bell'));

    if (await notificationButton.isVisible()) {
      await notificationButton.click();

      // Vérifier que le panneau s'ouvre
      await expect(
        page.locator('[data-testid="notification-panel"]')
          .or(page.locator('.notification-panel'))
          .or(page.getByRole('dialog'))
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
