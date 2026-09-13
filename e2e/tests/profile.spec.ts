import { test, expect } from '../fixtures/auth.fixture';

test.describe('Profil utilisateur', () => {
  test('devrait afficher la page de profil', async ({ page }) => {
    await page.goto('/profile');

    await expect(page).toHaveURL(/.*profile.*/);
    await expect(page.getByRole('heading', { name: /profil/i })).toBeVisible();
  });

  test("devrait afficher les informations de l'utilisateur", async ({
    page,
  }) => {
    await page.goto('/profile');

    await expect(page.getByLabel('Prénom')).toBeVisible();
    await expect(page.getByLabel('Nom')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('devrait désactiver l\'enregistrement si l\'email est invalide', async ({
    page,
  }) => {
    await page.goto('/profile');

    const emailInput = page.getByLabel('Email');
    await emailInput.fill('email-invalide');

    await expect(
      page.getByRole('button', { name: /enregistrer les modifications/i }),
    ).toBeDisabled();
  });

  test('devrait afficher la section sécurité', async ({ page }) => {
    await page.goto('/profile');

    await page.getByRole('button', { name: /sécurité/i }).click();

    await expect(page.locator('#password-section')).toBeVisible();
  });
});
