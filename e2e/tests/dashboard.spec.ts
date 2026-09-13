import { test, expect } from '../fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test('devrait afficher le dashboard après connexion', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });

  test("devrait afficher le menu utilisateur", async ({ page }) => {
    await page.goto('/dashboard');

    const userMenu = page.getByRole('button', { name: 'Menu utilisateur' });
    await expect(userMenu).toBeVisible();

    await userMenu.click();
    await expect(page.getByRole('menuitem', { name: /profil/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /déconnexion/i })).toBeVisible();
  });

  test('devrait permettre la navigation vers le profil', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByRole('button', { name: 'Menu utilisateur' }).click();
    await page.getByRole('menuitem', { name: /profil/i }).click();

    await expect(page).toHaveURL(/.*profile.*/);
  });

  test('devrait permettre la déconnexion', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByRole('button', { name: 'Menu utilisateur' }).click();
    await page.getByRole('menuitem', { name: /déconnexion/i }).click();

    await expect(page).toHaveURL(/\/(login)?$/);
  });
});

test.describe('Dashboard - Notifications', () => {
  test("devrait afficher l'icône de notifications", async ({ page }) => {
    await page.goto('/dashboard');

    await expect(
      page.getByRole('button', { name: /notifications/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test('devrait ouvrir le panneau de notifications', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByRole('button', { name: /notifications/i }).click();

    await expect(page.locator('app-notification-panel')).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Dashboard - Onglets', () => {
  for (const [tab, label] of [
    ['courses', /cours/i],
    ['students', /élèves/i],
    ['invoices', /factures?/i],
    ['calendar', /disponibilités/i],
  ] as const) {
    test(`devrait afficher l'onglet "${tab}"`, async ({ page }) => {
      await page.goto(`/dashboard?tab=${tab}`);

      await expect(page.getByRole('heading', { name: label }).first()).toBeVisible(
        { timeout: 10000 },
      );
    });
  }
});
