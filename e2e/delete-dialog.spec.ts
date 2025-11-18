import { test, expect } from '@playwright/test';

test.describe('Delete Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the community recipes API
    await page.route('**/functions/v1/recipes*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'recipe:1234567890:abc123',
              name: 'Test Smoothie',
              contributor: 'TestUser',
              emoji: '🥤',
              color: '#9333EA',
              ingredients: ['1 banana', '1 cup milk'],
              instructions: 'Blend everything',
              servings: 2,
              prepTime: '5 min',
              containsFat: false,
              containsNuts: false,
              createdAt: new Date().toISOString(),
            },
          ]),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    // Wait for app to load
    await expect(page.getByText('Smoothie de Jour')).toBeVisible();
  });

  test('should delete recipe when delete button is clicked', async ({ page }) => {
    // Click "Get Another Recipe" to show a recipe
    const getRecipeButton = page.getByRole('button', { name: /get another recipe/i });
    await getRecipeButton.click();

    // Wait for recipe to appear
    await expect(page.getByText('Test Smoothie')).toBeVisible({ timeout: 5000 });

    // Click delete button
    const deleteButton = page.getByTitle('Delete recipe');
    await deleteButton.click();

    // Wait for dialog to appear
    await expect(page.getByText('Delete Recipe?')).toBeVisible({ timeout: 5000 });

    // Verify dialog is visible
    const dialog = page.getByText('Delete Recipe?');
    await expect(dialog).toBeVisible();

    // Click the Delete button in the dialog
    const confirmDeleteButton = page.getByRole('button', { name: /^delete$/i });
    
    // Set up a listener to catch if backdrop closes the dialog
    let backdropClicked = false;
    page.on('console', (msg) => {
      if (msg.text().includes('Backdrop clicked directly')) {
        backdropClicked = true;
      }
    });

    // Click the delete button
    await confirmDeleteButton.click();

    // Wait a bit to see if backdrop intercepts
    await page.waitForTimeout(500);

    // The dialog should either be gone (deleted) or still visible (backdrop didn't close it)
    // But we should NOT see "Backdrop clicked directly" in console
    expect(backdropClicked).toBe(false);

    // The recipe should be deleted (not visible)
    await expect(page.getByText('Test Smoothie')).not.toBeVisible({ timeout: 3000 });
  });
});

