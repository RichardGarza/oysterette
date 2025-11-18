import { test, expect } from '@playwright/test';

test.describe('Review Flow', () => {
  test('oysters browse page loads and displays search', async ({ page }) => {
    await page.goto('http://localhost:3001/oysters');
    
    // Verify page loaded with search input
    await expect(page.getByPlaceholder(/Search oysters/i)).toBeVisible();
    
    // Verify header is present
    await expect(page.getByText('Browse Oysters')).toBeVisible();
  });

  test('login page loads correctly', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Verify login form elements by label
    await expect(page.getByRole('heading', { name: /Log In/i })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    // Use button[type="submit"] to avoid matching Google Sign In button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
