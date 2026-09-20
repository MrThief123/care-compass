import { expect, test } from "@playwright/test";

const TASK_LOG = "/family/client-margaret/tasks?as=family";

async function filterBoxes(page: import("@playwright/test").Page) {
  // The search box is the bordered wrapper around the input; the select carries its own border.
  const search = await page.getByPlaceholder("Search tasks").locator("..").boundingBox();
  const status = await page.getByLabel("Status").boundingBox();
  return { search: search!, status: status! };
}

for (const width of [1280, 640]) {
  test(`[FAM-UI-07][PRD] lines the search box up with the Status select at ${width}px wide, including with no matches`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(TASK_LOG);

    const initial = await filterBoxes(page);
    expect(initial.status.y).toBeCloseTo(initial.search.y, 0);
    expect(initial.status.height).toBeCloseTo(initial.search.height, 0);

    // The "No matches" line under the search box must not push the box out of line.
    await page.getByPlaceholder("Search tasks").fill("zzzz");
    await expect(page.getByText(/No matches for/)).toBeVisible();
    const noMatches = await filterBoxes(page);
    expect(noMatches.status.y).toBeCloseTo(noMatches.search.y, 0);
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
