import { expect, test } from "@playwright/test";

/*
 * CHG-014: Task detail has an 'Edit event' button by its title, and Back
 * returns to wherever the task was opened from (Calendar, Home or Task log),
 * on the exact view it was opened from.
 */

const CLIENT = "/family/client-margaret";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test("[FAM-UI-07][AC-10] opened from the Calendar, Back returns to the same week and selected day", async ({
  page,
}) => {
  await page.goto(`${CLIENT}/calendar?view=week&date=2026-12-02`);
  await expect(page.getByRole("heading", { level: 1, name: "30 Nov – 6 Dec 2026" })).toBeVisible();

  // Pick Thursday, then open Friday's Physiotherapy block.
  await page.getByTestId("week-grid-header-2026-12-03").click();
  const tasks = page.getByRole("region", { name: "Tasks" });
  await expect(tasks.getByText("Thursday 3 December")).toBeVisible();
  await page.getByTestId("week-grid-day-2026-12-04").getByText("Physiotherapy").click();

  await expect(page).toHaveURL(/\/tasks\/[^?]+\?from=calendar&view=week&date=2026-12-03$/);
  await expect(page.getByRole("heading", { level: 1, name: "Physiotherapy" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit event" })).toBeVisible();

  await page.getByRole("link", { name: "Back to Calendar" }).click();

  await expect(page).toHaveURL(`${CLIENT}/calendar?view=week&date=2026-12-03`);
  await expect(page.getByRole("heading", { level: 1, name: "30 Nov – 6 Dec 2026" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Tasks" }).getByText("Thursday 3 December"),
  ).toBeVisible();
});

test("[FAM-UI-07][AC-10] opened from the Calendar's month Log, Back returns to that month view", async ({
  page,
}) => {
  await page.goto(`${CLIENT}/calendar?view=month&date=2026-11-29&month=2026-12`);
  await expect(page.getByRole("heading", { level: 1, name: "December 2026" })).toBeVisible();

  // The first task row, not 'View all'.
  await page.getByRole("region", { name: "Log" }).locator('a[href*="/tasks/"]').first().click();
  await expect(page).toHaveURL(/from=calendar&view=month&date=2026-11-29&month=2026-12$/);

  await page.getByRole("link", { name: "Back to Calendar" }).click();
  await expect(page).toHaveURL(`${CLIENT}/calendar?view=month&date=2026-11-29&month=2026-12`);
  await expect(page.getByRole("heading", { level: 1, name: "December 2026" })).toBeVisible();
});

test("[FAM-UI-07][AC-10] opened from Home, Back returns to Home", async ({ page }) => {
  await page.goto(`${CLIENT}/home`);

  await page
    .getByRole("region", { name: "Recent activity" })
    .locator('a[href*="/tasks/"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/tasks\/[^?]+\?from=home$/);

  await page.getByRole("link", { name: "Back to Home" }).click();
  await expect(page).toHaveURL(`${CLIENT}/home`);
  await expect(page.getByRole("region", { name: "Recent activity" })).toBeVisible();
});

test("[FAM-UI-07][AC-10] opened from a filtered, paged Task log, Back returns to the same view", async ({
  page,
}) => {
  await page.goto(`${CLIENT}/tasks?status=done&page=2`);
  await expect(page.getByText(/^Showing 21-40 of \d+$/)).toBeVisible();

  await page.getByRole("row").nth(1).getByRole("link").click();
  await expect(page).toHaveURL(/\/tasks\/[^?]+\?from=tasks&status=done&page=2$/);

  await page.getByRole("link", { name: "Back to Task log" }).click();
  await expect(page).toHaveURL(`${CLIENT}/tasks?status=done&page=2`);
  await expect(page.getByText(/^Showing 21-40 of \d+$/)).toBeVisible();
});

test("[FAM-UI-07][AC-11] a hostile from falls back to 'Back to Task log' and never leaves the app", async ({
  page,
}) => {
  const key = encodeURIComponent("event-margaret-morning-meds:2026-11-30T09:00:00+11:00");
  await page.goto(`${CLIENT}/tasks/${key}?from=https%3A%2F%2Fevil.example&q=meds`);

  await page.getByRole("link", { name: "Back to Task log" }).click();
  await expect(page).toHaveURL(`${CLIENT}/tasks?q=meds`);
});

test("[FAM-UI-07][AC-09] the Edit event button opens the event's edit page", async ({ page }) => {
  const key = encodeURIComponent("event-margaret-physio:2026-11-30T11:30:00+11:00");
  await page.goto(`${CLIENT}/tasks/${key}?from=home`);

  const edit = page.getByRole("link", { name: "Edit event" });
  const box = (await edit.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);

  await edit.click();
  await expect(page).toHaveURL(`${CLIENT}/events/event-margaret-physio/edit`);
});

for (const width of [1920, 1440, 1280, 1024, 768]) {
  test(`[FAM-UI-07][AC-09] Task detail at ${width}px: no horizontal scroll, the Edit event button never overlaps the title`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const key = encodeURIComponent("event-margaret-morning-meds:2026-11-30T09:00:00+11:00");
    await page.goto(`${CLIENT}/tasks/${key}?from=calendar&view=week&date=2026-11-30`);

    const title = page.getByRole("heading", { level: 1 });
    const edit = page.getByRole("link", { name: "Edit event" });
    await expect(edit).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    const a = (await title.boundingBox())!;
    const b = (await edit.boundingBox())!;
    const overlaps =
      a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    expect(overlaps).toBe(false);
  });
}
