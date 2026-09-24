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

/*
 * CHG-015: Edit event opens on the occurrence being viewed, and Save event /
 * Cancel return to a validated origin instead of `router.back()`, so they work
 * after a reload or from a shared link.
 */

const CLIENT = "/family/client-margaret";
const PHYSIO_28_NOV = encodeURIComponent("event-margaret-physio:2026-11-28T11:30:00+11:00");

test("[FAM-UI-03][AC-07][AC-08] Calendar → Task detail → Edit event opens that occurrence; Cancel and Back return along the same path", async ({
  page,
}) => {
  const detail = `${CLIENT}/tasks/${PHYSIO_28_NOV}?from=calendar&view=month&date=2026-11-28&month=2026-11`;
  await page.goto(detail);

  await page.getByRole("link", { name: "Edit event" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Edit event" })).toBeVisible();
  await expect(page.getByLabel("Date")).toHaveValue("Saturday 28 November 2026");

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveURL(detail);

  await page.getByRole("link", { name: "Back to Calendar" }).click();
  await expect(page).toHaveURL(`${CLIENT}/calendar?view=month&date=2026-11-28&month=2026-11`);
});

test("[FAM-UI-03][AC-08] after a reload of a shared Edit event link, Save event still returns to the Task detail and its origin", async ({
  page,
}) => {
  await page.goto(
    `${CLIENT}/events/event-margaret-physio/edit?occurrence=${PHYSIO_28_NOV}&from=home`,
  );
  await page.reload();
  await expect(page.getByLabel("Date")).toHaveValue("Saturday 28 November 2026");

  await page.getByRole("button", { name: "Save event" }).click();
  await expect(page).toHaveURL(`${CLIENT}/tasks/${PHYSIO_28_NOV}?from=home`);

  await page.getByRole("link", { name: "Back to Home" }).click();
  await expect(page).toHaveURL(`${CLIENT}/home`);
});

test("[FAM-UI-03][AC-08] a hostile origin on Edit event never leaves the app", async ({ page }) => {
  await page.goto(
    `${CLIENT}/events/event-margaret-physio/edit?occurrence=${PHYSIO_28_NOV}&from=${encodeURIComponent("https://evil.example")}`,
  );

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveURL(`${CLIENT}/tasks/${PHYSIO_28_NOV}?from=tasks`);
});

test("[FAM-UI-03][AC-09] Add event's Cancel returns to Family Home, even opened directly", async ({
  page,
}) => {
  await page.goto(`${CLIENT}/events/new`);

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveURL(`${CLIENT}/home`);
});
