import { expect, test } from "@playwright/test";

test("[F0-19][AC-06] the root URL resolves to the app, not the showcase", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Care Compass/);
});
