import { expect, test, type Page } from "@playwright/test";

const TASK_LOG = "/family/client-margaret/tasks?as=family";

async function filterBoxes(page: Page) {
  // The search box is the bordered wrapper around the input; the select carries its own border.
  const search = page.getByPlaceholder("Search tasks").locator("..");
  const status = page.getByLabel("Status", { exact: true });
  await expect(search).toBeVisible();
  await expect(status).toBeVisible();
  return { search: (await search.boundingBox())!, status: (await status.boundingBox())! };
}

/** Polls until the two boxes share a top edge and a height, so a late layout shift cannot fail it. */
async function expectAligned(page: Page) {
  await expect
    .poll(async () => {
      const { search, status } = await filterBoxes(page);
      return Math.max(Math.abs(status.y - search.y), Math.abs(status.height - search.height));
    })
    .toBeLessThan(0.5);
}

for (const width of [1280, 640]) {
  test(`[FAM-UI-07][PRD] lines the search box up with the Status select at ${width}px wide, including with no matches`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(TASK_LOG);

    await expectAligned(page);

    // The "No matches" line under the search box must not push the box out of line. The search is
    // the URL's `?q=`, so the page renders that state itself: no typing, which would need the client
    // bundle (`next dev` refuses it to the 127.0.0.1 origin these tests use).
    await page.goto(`${TASK_LOG}&q=zzzz`);
    await expect(page.getByText(/No matches for/)).toBeVisible();
    await expectAligned(page);
  });
}

test("[FAM-UI-07][PRD] stacks the search box and Status select without a gap above the search when the row is narrow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await page.goto(TASK_LOG);

  const heading = await page.getByRole("heading", { name: "Task log" }).boundingBox();
  const { search, status } = await filterBoxes(page);
  expect(search.y - (heading!.y + heading!.height)).toBeCloseTo(20, 0);
  expect(status.y).toBeGreaterThan(search.y + search.height);
});
