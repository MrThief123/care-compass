import { expect, test } from "@playwright/test";

// Playwright serves a production build (`npm run start`), so these run under NODE_ENV=production.
test.describe("[F0-19] root route and dev-preview guard", () => {
  test("[F0-19][AC-01] T-05 / redirects away from the showcase", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole("link", { name: "UI-01" })).toHaveCount(0);
  });

  for (const path of [
    "/dev-preview",
    "/dev-preview-calendar-kit",
    "/dev-preview-database",
    "/dev-preview-forms-kit",
  ]) {
    test(`[F0-19][AC-03] T-05 ${path} is 404 in production`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
    });
  }
});
