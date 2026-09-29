import { expect, test } from "@playwright/test";

test("[FAM-10][AC-04] T-06 given Home, when 'View breakdown' is clicked, then the Budget page opens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/family/client-margaret/home?as=family");

  await page.getByRole("link", { name: "View breakdown" }).click();

  await expect(page).toHaveURL(/\/family\/client-margaret\/budget(\?|$)/);
  await expect(page.getByRole("heading", { level: 2, name: "Funds by source" })).toBeVisible();
});
