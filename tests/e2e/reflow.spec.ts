import { expect, test, type Page } from "@playwright/test";
import { copy, flavours, flavourTitle } from "@/content/page";

/** Elements that overflow the viewport or their own box. Empty means the page reflows cleanly. */
function findOverflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > vw) {
      problems.push(`page scrolls horizontally: ${document.documentElement.scrollWidth} > ${vw}`);
    }
    // A Flavour card's resting tilt paints its corners a few px past its cell.
    // That is decoration, not clipped content, so set it aside for the box checks.
    const cards = document.querySelectorAll<HTMLElement>("[data-flavour]");
    for (const card of cards) {
      card.style.transition = "none";
      card.style.rotate = "none";
    }
    const describe = (el: Element) =>
      `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 40)}"`;

    for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
      if (el.closest("svg, .sr-only")) continue;
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

test("an open Quick-add picker reflows at 320 CSS px", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 640 } });
  const page = await context.newPage();
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const card = page.getByRole("article", { name: flavourTitle(flavours[0]) });
  await expect(async () => {
    await card.getByRole("button", { name: copy.quickAdd.open, exact: true }).click();
    await expect(card.getByRole("group", { name: copy.quickAdd.heading })).toBeVisible({ timeout: 500 });
  }).toPass();
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
