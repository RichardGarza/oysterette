import { test, expect } from '@playwright/test';

test.describe('Friends Page', () => {
  test('loads friends page and displays UI', async ({ page }) => {
    await page.goto('http://localhost:3001/friends');
    
    // Should redirect to login if not authenticated, but assume logged in or test public parts
    await expect(page.getByRole('heading', { name: /Friends/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search users/i)).toBeVisible();
    
    // Tabs
    await expect(page.getByText(/Friends \(/i)).toBeVisible();
    await expect(page.getByText(/Pending/i)).toBeVisible();
    await expect(page.getByText(/Activity/i)).toBeVisible();
  });
});
