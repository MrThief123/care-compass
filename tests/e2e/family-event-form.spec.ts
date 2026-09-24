import { expect, test } from "@playwright/test";

test("[FAM-UI-03][AC-04] 'Enter event' on Family Home opens the Add event screen", async ({
  page,
}) => {
  await page.goto("/family/client-margaret/home?as=family");

  await page.getByRole("link", { name: "Enter event" }).click();

  await expect(page).toHaveURL(/\/family\/client-margaret\/events\/new(\?|$)/);
  await expect(page.getByRole("heading", { level: 1, name: "Add event" })).toBeVisible();
  await expect(page.getByLabel("Date")).toBeVisible();
});

test("[FAM-UI-03][AC-01] Edit event opens prefilled for Physiotherapy", async ({ page }) => {
  await page.goto("/family/client-margaret/events/event-margaret-physio/edit?as=family");

  await expect(page.getByRole("heading", { level: 1, name: "Edit event" })).toBeVisible();
  await expect(page.getByLabel("Date")).toHaveValue("Monday 30 November 2026");
  await expect(page.getByText("Physio referral.pdf")).toBeVisible();
});
