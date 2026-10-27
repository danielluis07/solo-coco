import { expect, test, type Page } from "@playwright/test";

/** Elements that overflow the viewport or their own box. Empty means the page reflows cleanly. */
function findOverflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > vw) {
      problems.push(`page scrolls horizontally: ${document.documentElement.scrollWidth} > ${vw}`);
    }
    const describe = (el: Element) =>
      `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 40)}"`;

    for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
      if (el.closest("svg") || el.classList.contains("sr-only")) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.left < -1 || rect.right > vw + 1) {
        problems.push(`${describe(el)} spills out of the viewport (${rect.left}–${rect.right})`);
      }
      if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) {
        problems.push(`${describe(el)} clips or overflows its content (${el.scrollWidth} > ${el.clientWidth})`);
      }
    }
    return problems;
  });
}

test("reflows at 320 CSS px without horizontal scroll or clipped content", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 640 } });
  const page = await context.newPage();
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(await findOverflow(page)).toEqual([]);
  await context.close();
});

test("stays readable at 200% zoom on a 1280 × 720 desktop", async ({ browser }) => {
  // 200% zoom halves the CSS viewport and doubles the device pixels per CSS px.
  const context = await browser.newContext({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(await findOverflow(page)).toEqual([]);
  await context.close();
});
