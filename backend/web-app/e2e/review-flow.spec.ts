import { test, expect } from '@playwright/test';

test.describe('Review Flow', () => {
  test('creates new review successfully', async ({ page }) => {
    await page.goto('http://localhost:3001/oysters/test-id');  // Assume oyster detail

    // Click Write Review
    await page.getByRole('link', { name: /Write Review/i }).click();
    await expect(page).toHaveURL(/.*\/review/);

    // Fill form (simplified)
    await page.selectOption('input[name="rating"]', 'LIKE_IT');  // Assume select or button
    await page.fill('textarea[placeholder*="thoughts"]', 'Test review');
    await page.getByRole('button', { name: /Submit Review/i }).click();

    await expect(page).toHaveURL(/.*\/oysters\/test-id/);
    await expect(page.getByText('Test review')).toBeVisible();  // Review appears
  });

  test('shows duplicate modal and updates review', async ({ page }) => {
    await page.goto('http://localhost:3001/oysters/test-id');

    // Assume already has review, click Write Review
    await page.getByRole('link', { name: /Write Review/i }).click();

    // Submit to trigger duplicate
    await page.getByRole('button', { name: /Submit Review/i }).click();

    // Modal appears
    await expect(page.getByText('Already Reviewed?')).toBeVisible();

    // Click Update Review?
    await page.getByRole('button', { name: /Update Review\?/i }).click();

    // Should navigate to edit mode
    await expect(page.getByText('Update')).toBeVisible();  // Title changes to Update
  });
});
