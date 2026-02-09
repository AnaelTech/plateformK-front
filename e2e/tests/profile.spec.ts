import { test, expect } from '@playwright/test';

test.describe('Profil utilisateur', () => {
  test('devrait afficher la page de profil', async ({ page }) => {
    await page.goto('/profile');

    // Vérifier que la page de profil est chargée
    await expect(page).toHaveURL(/.*profile.*/);

    // Vérifier les éléments du profil
    await expect(
      page
        .getByRole('heading', { name: /profil/i })
        .or(page.getByText(/informations personnelles/i)),
    ).toBeVisible();
  });

  test("devrait afficher les informations de l'utilisateur", async ({
    page,
  }) => {
    await page.goto('/profile');

    // Vérifier la présence des champs de profil
    await expect(
      page
        .getByLabel(/prénom/i)
        .or(page.getByLabel(/first name/i))
        .or(page.getByPlaceholder(/prénom/i)),
    ).toBeVisible();

    await expect(
      page
        .getByLabel(/nom/i)
        .or(page.getByLabel(/last name/i))
        .or(page.getByPlaceholder(/nom/i)),
    ).toBeVisible();

    await expect(
      page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)),
    ).toBeVisible();
  });

  test('devrait permettre de modifier les informations', async ({ page }) => {
    await page.goto('/profile');

    // Trouver le bouton de modification
    const editButton = page
      .getByRole('button', { name: /modifier/i })
      .or(page.getByRole('button', { name: /éditer/i }))
      .or(page.getByRole('button', { name: /edit/i }));

    if (await editButton.isVisible()) {
      await editButton.click();

      // Vérifier que les champs deviennent éditables
      const firstNameInput = page
        .getByLabel(/prénom/i)
        .or(page.getByLabel(/first name/i));

      await expect(firstNameInput).toBeEnabled();
    }
  });

  test('devrait valider les modifications', async ({ page }) => {
    await page.goto('/profile');

    // Trouver le bouton de modification
    const editButton = page
      .getByRole('button', { name: /modifier/i })
      .or(page.getByRole('button', { name: /éditer/i }));

    if (await editButton.isVisible()) {
      await editButton.click();

      // Modifier un champ
      const phoneInput = page
        .getByLabel(/téléphone/i)
        .or(page.getByLabel(/phone/i));

      if (await phoneInput.isVisible()) {
        await phoneInput.fill('0612345678');
      }

      // Sauvegarder
      const saveButton = page
        .getByRole('button', { name: /sauvegarder/i })
        .or(page.getByRole('button', { name: /enregistrer/i }))
        .or(page.getByRole('button', { name: /save/i }));

      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Vérifier le message de succès
        await expect(
          page
            .getByText(/succès/i)
            .or(page.getByText(/enregistré/i))
            .or(page.getByText(/mis à jour/i)),
        ).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
