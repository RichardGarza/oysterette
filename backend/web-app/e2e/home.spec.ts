import { test, expect } from '@playwright/test';

test('Home page loads and navigates to search', async ({ page }) => {
  await page.goto('http://localhost:3001');

  // Hero section
  await expect(page.getByText('Discover Oysters from Around the World')).toBeVisible();
  await expect(page.getByRole('link', { name: /Search for Oysters/i })).toBeVisible();

  // Click search button
  await page.getByRole('link', { name: /Search for Oysters/i }).click();
  await expect(page).toHaveURL(/.*\/oysters/);

  // Check oysters page has search input
  await expect(page.getByPlaceholder(/Search oysters/i)).toBeVisible();
});

test('Home page theme toggle works', async ({ page }) => {
  await page.goto('http://localhost:3001');

  // Initial theme button (light mode shows moon)
  const themeButton = page.getByRole('button', { name: 'Toggle theme' });
  await expect(themeButton).toHaveText('🌙');

  // Toggle to dark - check for 'dark' class on html
  await themeButton.click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  // Toggle back - remove 'dark' class
  await themeButton.click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
});
