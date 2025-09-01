import { test, expect } from '@playwright/test';

// Basic smoke covering demo login and navigation to key partner pages
// Assumes the dev server is already running on http://localhost:8080

test.describe('Demo mode smoke', () => {
  test('login as demo partner admin and navigate to Resources and Vendors', async ({ page }) => {
    // Go to demo login
    await page.goto('http://localhost:8080/demo-login');

    // Click the Partner Admin quick login button
    // The button label observed in the app is "Try as Partner Admin"
    const partnerAdminBtn = page.getByRole('button', { name: /Try as Partner Admin/i });
    await expect(partnerAdminBtn).toBeVisible();
    await partnerAdminBtn.click();

    // Expect to land on the dashboard (welcome banner visible)
    await expect(page.getByText(/Welcome back/i)).toBeVisible({ timeout: 15000 });

    // Navigate to Resources page and assert it renders
    await page.goto('http://localhost:8080/resources');
    await expect(page.getByRole('heading', { name: /Resources Management/i })).toBeVisible();

    // Navigate to Vendors page and assert it renders
    await page.goto('http://localhost:8080/vendors');
    await expect(page.getByRole('heading', { name: /Vendor Management/i })).toBeVisible();
  });

  test('login as demo vendor and verify access denied on Vendors page', async ({ page }) => {
    // Go to demo login
    await page.goto('http://localhost:8080/demo-login');

    // Click the Vendor quick login button
    const tryAsVendorBtn = page.getByRole('button', { name: /Try as Vendor/i });
    if (await tryAsVendorBtn.isVisible().catch(() => false)) {
      await tryAsVendorBtn.click();
    } else {
      const startAsVendorBtn = page.getByRole('button', { name: /Start Demo as Vendor/i });
      await expect(startAsVendorBtn).toBeVisible();
      await startAsVendorBtn.click();
    }

    // Wait for dashboard to load to ensure demo auth state is established
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/i, { timeout: 15000 });
    // Vendor dashboard heading
    await expect(page.getByRole('heading', { name: /Vendor Dashboard/i })).toBeVisible({ timeout: 15000 });

    // Navigate to Vendors page and expect Access Denied
    await page.goto('http://localhost:8080/vendors');
    await expect(page.getByText(/Access Denied/i)).toBeVisible();
    await expect(page.getByText(/Only Super Administrators and Partner Administrators can manage vendors/i)).toBeVisible();

    // Ensure Add Vendor button is not visible for Vendor role
    await expect(page.getByRole('button', { name: /Add Vendor/i })).not.toBeVisible();
  });
});