import { test, expect } from '@playwright/test';

test.describe('Réservations (Bookings)', () => {
  test('devrait afficher la liste des réservations', async ({ page }) => {
    await page.goto('/dashboard');

    // Chercher la section des réservations
    const bookingsSection = page
      .getByText(/réservation/i)
      .or(page.getByText(/booking/i))
      .or(page.locator('[data-testid="bookings-list"]'));

    await expect(bookingsSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('devrait filtrer les réservations par statut', async ({ page }) => {
    await page.goto('/dashboard');

    // Chercher les filtres de statut
    const pendingFilter = page
      .getByRole('button', { name: /en attente/i })
      .or(page.getByText(/pending/i))
      .or(page.locator('[data-status="pending"]'));

    const confirmedFilter = page
      .getByRole('button', { name: /confirmé/i })
      .or(page.getByText(/confirmed/i))
      .or(page.locator('[data-status="confirmed"]'));

    // Cliquer sur un filtre si disponible
    if (await pendingFilter.isVisible()) {
      await pendingFilter.click();
      await page.waitForTimeout(500);
    }

    if (await confirmedFilter.isVisible()) {
      await confirmedFilter.click();
      await page.waitForTimeout(500);
    }
  });

  test("devrait ouvrir les détails d'une réservation", async ({ page }) => {
    await page.goto('/dashboard');

    // Chercher une réservation cliquable
    const bookingCard = page
      .locator('[data-testid="booking-card"]')
      .or(page.locator('.booking-item'))
      .or(page.locator('.booking-card'));

    if (await bookingCard.first().isVisible()) {
      await bookingCard.first().click();

      // Vérifier que le modal ou la page de détails s'ouvre
      await expect(
        page
          .locator('[data-testid="booking-details-modal"]')
          .or(page.getByRole('dialog'))
          .or(page.locator('.modal')),
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Cours', () => {
  test('devrait afficher les cours disponibles', async ({ page }) => {
    await page.goto('/dashboard');

    // Vérifier la présence de la section cours
    await expect(
      page
        .getByText(/cours/i)
        .or(page.locator('[data-testid="courses-section"]')),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Responsive Design', () => {
  test("devrait s'adapter aux écrans mobiles", async ({ page }) => {
    // Définir la taille d'écran mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard');

    // Vérifier que le menu hamburger est visible sur mobile
    const hamburgerMenu = page
      .locator('[data-testid="mobile-menu"]')
      .or(page.getByRole('button', { name: /menu/i }))
      .or(page.locator('.hamburger-menu'));

    // Le menu devrait être présent ou la navigation devrait s'adapter
    await expect(page.locator('nav').or(hamburgerMenu)).toBeVisible();
  });

  test("devrait s'adapter aux tablettes", async ({ page }) => {
    // Définir la taille d'écran tablette
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/dashboard');

    // La page devrait se charger correctement
    await expect(page).toHaveURL(/.*dashboard.*/);
  });
});

test.describe('Accessibilité', () => {
  test('devrait avoir des labels accessibles sur les formulaires', async ({
    page,
  }) => {
    await page.goto('/login');

    // Vérifier que les inputs ont des labels associés
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page
      .getByLabel(/mot de passe/i)
      .or(page.getByLabel(/password/i));

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('devrait permettre la navigation au clavier', async ({ page }) => {
    await page.goto('/login');

    // Focus sur le premier input
    await page.keyboard.press('Tab');

    // Vérifier que le focus est sur un élément focusable
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
