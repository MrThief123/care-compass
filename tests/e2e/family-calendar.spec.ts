import { expect, test } from "@playwright/test";

const CALENDAR = "/family/client-margaret/calendar?as=family";

test("[FAM-UI-02][AC-05] T-05 given the week view, when M is pressed, a December 2026 month grid is shown", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(CALENDAR);

  await expect(page.getByRole("heading", { level: 1, name: "30 Nov – 6 Dec 2026" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "W" })).toHaveAttribute("aria-checked", "true");

  await page.getByRole("radio", { name: "M" }).click();

  await expect(page).toHaveURL(/view=month/);
  await expect(page.getByRole("heading", { level: 1, name: "December 2026" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "M" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("month-grid-day-2026-12-01")).toHaveAttribute(
    "data-in-month",
    "true",
  );
  await expect(page.getByTestId("month-grid-day-2026-12-31")).toHaveAttribute(
    "data-in-month",
    "true",
  );
  // The Friday Physiotherapy is drawn in the month too.
  await expect(page.getByTestId("month-grid-day-2026-12-04")).toContainText("Physiotherapy");
});

test("[FAM-UI-02][AC-03] selecting a day survives a reload (the URL keeps it)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(CALENDAR);

  await page.getByTestId("week-grid-header-2026-12-01").click();
  const tasks = page.getByRole("region", { name: "Tasks" });
  await expect(tasks.getByText("Tuesday 1 December")).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("region", { name: "Tasks" }).getByText("Tuesday 1 December"),
  ).toBeVisible();
});

for (const width of [1920, 1280, 1024, 768]) {
  test(`[FAM-UI-02][PRD] nothing overflows the page at ${width}px wide`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(CALENDAR);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
