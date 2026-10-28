import { expect, test, type Page } from "@playwright/test";
import { defaultPack, flavours, flavourTitle, packLabel } from "@/content/page";

const card = (page: Page) => page.getByRole("article", { name: flavourTitle(flavours[0]) });

test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("cards show the illustrative price without purchase controls", async ({ page }) => {
  for (const flavour of flavours) {
    const c = page.getByRole("article", { name: flavourTitle(flavour) });
    await expect(c.getByText(packLabel(defaultPack), { exact: true })).toBeVisible();
    await expect(c.getByRole("button")).toHaveCount(0);
    await expect(c.getByRole("radio")).toHaveCount(0);
  }
});

const hardShadow = /rgb\(58, 42, 29\) 3px 4px 0px 0px/;

test("cards straighten from their resting tilt over 240 ms and keep the hard shadow", async ({ page }) => {
  const c = card(page);
  await expect(c).toHaveCSS("rotate", "-1deg");
  await expect(c).toHaveCSS("transition-duration", "0.24s");
  await expect(c).toHaveCSS("box-shadow", hardShadow);
  // Not a regular grid of tilts.
  const tilts = await page.locator("article").evaluateAll((els) => els.map((el) => getComputedStyle(el).rotate));
  expect(new Set(tilts).size).toBe(tilts.length);

  await c.getByRole("heading", { level: 3 }).hover();
  await expect(c).toHaveCSS("rotate", "0deg");
  await expect(c).toHaveCSS("box-shadow", hardShadow);

  await page.mouse.move(0, 0);
  await expect(c).toHaveCSS("rotate", "-1deg");
});

test("reduced motion keeps cards untilted with no transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const c = card(page);
  await expect(c).toHaveCSS("rotate", "none");
  await expect(c).toHaveCSS("transition-duration", "0s");
});
