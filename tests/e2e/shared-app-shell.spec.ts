import { expect, test } from "@playwright/test";

test("[F0-15][AC-06] marks the Calendar rail item active on /carer/calendar", async ({ page }) => {
  await page.goto("/carer/calendar");

  await expect(page.getByRole("link", { name: "Calendar" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
