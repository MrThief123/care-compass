import { expect, test } from "@playwright/test";

const CLIENT = "/family/client-margaret";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test("[FAM-15][AC-03] T-05 the Overdue card's chevron on 'Weekly weigh-in' opens its Task detail", async ({
  page,
}) => {
  await page.goto(`${CLIENT}/home`);

  await page
    .getByRole("region", { name: "Overdue" })
    .getByRole("link", { name: /Weekly weigh-in/ })
    .click();

  await expect(page).toHaveURL(/\/tasks\/[^?]+\?from=home$/);
  await expect(page.getByRole("heading", { level: 1, name: "Weekly weigh-in" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Status" }).getByText("Overdue")).toBeVisible();
  await expect(page.getByText("Sunday 29 November 2026 · Assigned to —")).toBeVisible();
});

test("[FAM-15][AC-08] T-11 a Recent activity row opens its Task detail and Back returns to Home", async ({
  page,
}) => {
  await page.goto(`${CLIENT}/home`);
  const row = page
    .getByRole("region", { name: "Recent activity" })
    .locator('a[href*="/tasks/"]')
    .first();
  await row.click();

  await expect(page.getByRole("region", { name: "Status" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Home" }).click();
  await expect(page).toHaveURL(`${CLIENT}/home`);
});

test("[FAM-15][AC-08] T-11 a Calendar Log panel row opens its Task detail and Back returns to the Calendar", async ({
  page,
}) => {
  await page.goto(`${CLIENT}/calendar?view=month&date=2026-11-29&month=2026-12`);
  await page.getByRole("region", { name: "Log" }).locator('a[href*="/tasks/"]').first().click();

  await expect(page.getByRole("region", { name: "Status" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Calendar" }).click();
  await expect(page).toHaveURL(/\/calendar\?view=month/);
});

test("[FAM-15][AC-08] T-11 a Task log row opens its Task detail and Back returns to the Task log", async ({
  page,
}) => {
  await page.goto(`${CLIENT}/tasks`);
  await page.locator('a[href*="/tasks/"]').first().click();

  await expect(page.getByRole("region", { name: "Status" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Task log" }).click();
  await expect(page).toHaveURL(new RegExp(`${CLIENT}/tasks`));
});
