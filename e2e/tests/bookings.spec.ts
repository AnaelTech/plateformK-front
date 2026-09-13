import { test, expect } from '../fixtures/auth.fixture';

test.describe('Réservations / Cours', () => {
  test('devrait afficher la gestion des cours', async ({ page }) => {
    await page.goto('/dashboard?tab=courses');

    await expect(
      page.getByRole('heading', { name: /gestion des cours/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test('devrait lister les élèves', async ({ page }) => {
    await page.goto('/dashboard?tab=students');

    await expect(
      page.getByRole('heading', { name: /mes élèves/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test('devrait afficher la section de facturation', async ({ page }) => {
    await page.goto('/dashboard?tab=invoices');

    await expect(
      page.getByRole('heading', { name: /factur/i }).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('devrait afficher les disponibilités', async ({ page }) => {
    await page.goto('/dashboard?tab=calendar');

    await expect(
      page.getByRole('heading', { name: /mes disponibilités/i }),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Responsive Design', () => {
  test("devrait s'adapter aux écrans mobiles", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });

  test("devrait s'adapter aux tablettes", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });
});
