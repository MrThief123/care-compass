import { expect, test } from "@playwright/test";

test("[F0-15][AC-06] marks the Calendar rail item active on /carer/calendar", async ({ page }) => {
  await page.goto("/carer/calendar");

  await expect(page.getByRole("link", { name: "Calendar" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("[F0-15][PRD] keeps the rail and its buttons in view while the page scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/family/client-margaret/home?as=family");
  // Stand-in for a long screen: the shell, not the page content, is under test.
  await page.evaluate(() => {
    document.querySelector("main")!.style.minHeight = "3000px";
  });
  await page.evaluate(() => window.scrollTo(0, 1500));

  const rail = await page.getByRole("complementary", { name: "Family navigation" }).boundingBox();
  expect(rail!.y).toBeCloseTo(0, 0);
  expect(rail!.y + rail!.height).toBeGreaterThanOrEqual(720);
  for (const name of ["Home", "Info", "Calendar", "Budget", "Settings"]) {
    await expect(page.getByRole("link", { name })).toBeInViewport();
  }
});

for (const width of [768, 480, 338]) {
  test(`[F0-15][PRD] keeps header text inside the header bar, without overlap, at ${width}px wide`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/family/client-margaret/home?as=family");

    const result = await page.evaluate(() => {
      const bar = document.querySelector("header")!.getBoundingClientRect();
      const boxes: { text: string; l: number; r: number; t: number; b: number }[] = [];
      for (const el of document.querySelectorAll("header *")) {
        const ownText = [...el.childNodes].some(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        if (!ownText) continue;
        const range = document.createRange();
        range.selectNodeContents(el);
        for (const q of range.getClientRects()) {
          if (q.width > 0 && q.height > 0) {
            boxes.push({
              text: el.textContent!.trim().slice(0, 24),
              l: q.left,
              r: q.right,
              t: q.top,
              b: q.bottom,
            });
          }
        }
      }
      const outside = boxes
        .filter(
          (q) =>
            q.t < bar.top - 1 || q.b > bar.bottom + 1 || q.l < bar.left - 1 || q.r > bar.right + 1,
        )
        .map((q) => q.text);
      const overlapping: string[] = [];
      boxes.forEach((a, i) =>
        boxes.slice(i + 1).forEach((b) => {
          if (
            a.text !== b.text &&
            a.l < b.r - 1 &&
            b.l < a.r - 1 &&
            a.t < b.b - 1 &&
            b.t < a.b - 1
          ) {
            overlapping.push(`${a.text} / ${b.text}`);
          }
        }),
      );
      return {
        outside,
        overlapping,
        pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });

    expect(result.outside).toEqual([]);
    expect(result.overlapping).toEqual([]);
    expect(result.pageOverflow).toBeLessThanOrEqual(0);
  });
}
