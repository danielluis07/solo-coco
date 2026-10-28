import { expect, test } from "@playwright/test";
import { flavours } from "@/content/page";

test("final can renders load near the grid and keep their reserved dimensions", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => {
    if (request.url().includes("/flavours/")) requests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator("#sabores [data-can-render]")).toHaveCount(6);
  expect(requests).toHaveLength(0);
  for (const flavour of flavours) {
    const card = page.locator(`[data-flavour="${flavour.slug}"]`);
    const image = card.locator("img");
    await card.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute("src", `/flavours/${flavour.slug}.webp`);
    await expect(image).toHaveAttribute("loading", "lazy");
    await expect(image).toHaveAttribute("alt", "");
    await expect.poll(() => image.evaluate(async element => {
      await (element as HTMLImageElement).decode();
      return [(element as HTMLImageElement).naturalWidth, (element as HTMLImageElement).naturalHeight];
    })).toEqual([360, 520]);
  }
});

test("can renders remain available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("/");
    const image = page.locator('[data-flavour="so-o-coco"] img');
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBe(360);
  } finally { await context.close(); }
});
