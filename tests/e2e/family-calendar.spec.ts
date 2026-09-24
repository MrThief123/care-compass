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

test("[FAM-UI-02][AC-06][AC-07] the keyboard switches views, steps the range and goes back to today", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(CALENDAR);
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText("30 Nov – 6 Dec 2026");

  await page.keyboard.press("ArrowRight");
  await expect(heading).toHaveText("7 Dec – 13 Dec 2026");

  await page.keyboard.press("d");
  await expect(page).toHaveURL(/view=day/);
  await expect(heading).toHaveText("Monday 7 December 2026");
  await page.keyboard.press("ArrowLeft");
  await expect(heading).toHaveText("Sunday 6 December 2026");

  await page.keyboard.press("m");
  await expect(heading).toHaveText("December 2026");
  await page.keyboard.press("ArrowRight");
  await expect(heading).toHaveText("January 2027");

  await page.keyboard.press("t");
  await expect(heading).toHaveText("November 2026");
  await page.keyboard.press("w");
  await expect(heading).toHaveText("30 Nov – 6 Dec 2026");

  await page.keyboard.press("ArrowLeft");
  await expect(heading).toHaveText("23 Nov – 29 Nov 2026");
  await page.getByRole("button", { name: "Today" }).click();
  await expect(heading).toHaveText("30 Nov – 6 Dec 2026");
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

/*
 * CHG-016: a tick in the Tasks panel shows on the grid on the same page, with
 * the signed-in person's name where the view shows one. Nothing is saved.
 */
const PHYSIO_30_NOV = "event-margaret-physio:2026-11-30T11:30:00+11:00";

test("[FAM-UI-02][AC-08] ticking Physiotherapy turns its week block Done at once", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/family/client-margaret/calendar?view=week&date=2026-11-30&as=family");
  const block = page.getByTestId(`week-grid-block-${PHYSIO_30_NOV}`);
  await expect(block).toContainText("Planned:");

  await page.getByRole("region", { name: "Tasks" }).getByLabel("Physiotherapy").check();

  await expect(block).toContainText("Done:");
});

test("[FAM-UI-02][AC-08] in the day view a ticked task reads 'Done · Helen Doyle'; unticked, Planned again", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/family/client-margaret/calendar?view=day&date=2026-11-30&as=family");
  const block = page.getByTestId(`day-timeline-block-${PHYSIO_30_NOV}`);
  const box = page.getByRole("region", { name: "Tasks" }).getByLabel("Physiotherapy");

  await box.check();
  await expect(block).toContainText("Done · Helen Doyle");

  await box.uncheck();
  await expect(block).toContainText("Planned");
  await expect(block).not.toContainText("Helen Doyle");
});
