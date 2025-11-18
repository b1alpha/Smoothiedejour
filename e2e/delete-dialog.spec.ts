import { test, expect } from '@playwright/test';

test.describe('Delete Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the community recipes API to provide test data
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
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await expect(page.getByText('Smoothie de Jour')).toBeVisible();
  });

  test('should open delete dialog when delete button is clicked', async ({ page }) => {
    // Get a recipe to show
    await page.getByRole('button', { name: /get another recipe/i }).click();
    await expect(page.getByText('Test Smoothie')).toBeVisible();

    // Click delete button
    const deleteButton = page.getByTitle('Delete recipe');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Verify dialog appears
    const dialog = page.getByText('Delete Recipe?');
    await expect(dialog).toBeVisible();
    
    // Verify dialog content is visible
    await expect(page.getByText(/are you sure you want to delete/i)).toBeVisible();
  });

  test('should have clickable buttons in delete dialog', async ({ page }) => {
    // Get a recipe to show
    await page.getByRole('button', { name: /get another recipe/i }).click();
    await expect(page.getByText('Test Smoothie')).toBeVisible();

    // Open delete dialog
    await page.getByTitle('Delete recipe').click();
    await expect(page.getByText('Delete Recipe?')).toBeVisible();

    // Verify Cancel button is visible and clickable
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();

    // Verify Delete button is visible and clickable
    const confirmDeleteButton = page.getByRole('button', { name: /^delete$/i });
    await expect(confirmDeleteButton).toBeVisible();
    await expect(confirmDeleteButton).toBeEnabled();
  });

  test('should close dialog when Cancel button is clicked', async ({ page }) => {
    // Get a recipe to show
    await page.getByRole('button', { name: /get another recipe/i }).click();
    await expect(page.getByText('Test Smoothie')).toBeVisible();

    // Open delete dialog
    await page.getByTitle('Delete recipe').click();
    await expect(page.getByText('Delete Recipe?')).toBeVisible();

    // Click Cancel button
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    // Verify dialog is closed
    await expect(page.getByText('Delete Recipe?')).not.toBeVisible();
    
    // Verify recipe is still visible (dialog closed, recipe not deleted)
    await expect(page.getByText('Test Smoothie')).toBeVisible();
  });

  test('should close dialog when Delete button is clicked', async ({ page }) => {
    // Mock DELETE to succeed
    await page.route('**/functions/v1/recipes*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Get a recipe to show
    await page.getByRole('button', { name: /get another recipe/i }).click();
    await expect(page.getByText('Test Smoothie')).toBeVisible();

    // Open delete dialog
    await page.getByTitle('Delete recipe').click();
    await expect(page.getByText('Delete Recipe?')).toBeVisible();

    // Click Delete button
    const confirmDeleteButton = page.getByRole('button', { name: /^delete$/i });
    await confirmDeleteButton.click();

    // Verify dialog closes
    await expect(page.getByText('Delete Recipe?')).not.toBeVisible();
  });

  test('should close dialog when backdrop is clicked', async ({ page }) => {
    // Get a recipe to show
    await page.getByRole('button', { name: /get another recipe/i }).click();
    await expect(page.getByText('Test Smoothie')).toBeVisible();

    // Open delete dialog
    await page.getByTitle('Delete recipe').click();
    await expect(page.getByText('Delete Recipe?')).toBeVisible();

    // Click on backdrop (the element with backdrop-blur-sm class)
    // Click at a position that's definitely on the backdrop, not the dialog
    const backdrop = page.locator('.backdrop-blur-sm').last();
    await expect(backdrop).toBeVisible();
    
    // Click at the center of the backdrop
    await backdrop.click({ position: { x: 100, y: 100 } });

    // Verify dialog closes
    await expect(page.getByText('Delete Recipe?')).not.toBeVisible();
  });

  test('should have accessible dialog structure', async ({ page }) => {
    // Get a recipe to show
    await page.getByRole('button', { name: /get another recipe/i }).click();
    await expect(page.getByText('Test Smoothie')).toBeVisible();

    // Open delete dialog
    await page.getByTitle('Delete recipe').click();
    await expect(page.getByText('Delete Recipe?')).toBeVisible();

    // Verify dialog has proper heading
    const heading = page.getByRole('heading', { name: /delete recipe/i });
    await expect(heading).toBeVisible();

    // Verify buttons have proper labels
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^delete$/i })).toBeVisible();
  });
});
