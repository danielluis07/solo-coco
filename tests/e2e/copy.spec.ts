import { expect, test, type Locator } from "@playwright/test";
import {
  copy,
  defaultPack,
  flavours,
  flavourStats,
  flavourTitle,
  packLabel,
} from "@/content/page";

/** The phrase is shown exactly once in `scope`, visibly and exposed to assistive technology. */
async function expectOnce(scope: Locator, text: string) {
  // Decorative duplicates (e.g. the wordmark's lettering) sit under aria-hidden and don't count.
  const exposed = scope
    .getByText(text, { exact: true })
    .and(scope.page().locator(":not([aria-hidden='true'] *, [aria-hidden='true'])"));
  await expect(exposed, text).toHaveCount(1);
  await expect(exposed, text).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("header Copy", async ({ page }) => {
  const banner = page.getByRole("banner");
  await expectOnce(banner, copy.header.wordmark);
  for (const link of [...copy.header.nav, copy.header.cta]) {
    await expect(banner.getByRole("link", { name: link.label, exact: true })).toHaveCount(1);
  }
});

test("Hero Copy, including badges and meter labels, is readable in flow", async ({ page }) => {
  const hero = page.getByRole("region", { name: copy.hero.opening.headline, exact: true });
  const { opening, opened, transformation, rotatingCan } = copy.hero;

  for (const text of [
    opening.headline,
    opening.corner,
    opening.oppositeCorner,
    opening.scrollCue,
    ...opened.headline,
    ...opened.badges,
    ...transformation.meterLabels,
    rotatingCan.headline,
    rotatingCan.corner,
    rotatingCan.smallLine,
  ]) {
    await expectOnce(hero, text);
  }
  await expect(hero.getByRole("link", { name: opening.cta.label, exact: true })).toHaveCount(1);
  // The 000 → 100 counter is decorative and never exposed.
  await expect(hero.getByText(transformation.counter.to, { exact: true })).toHaveCount(0);
});

test("brand statement shows all three plaque phrases", async ({ page }) => {
  const statement = page.getByRole("region", { name: copy.statement.headline, exact: true });
  const { headline, plaque, body, closing, link } = copy.statement;
  for (const text of [headline, ...plaque, body, closing]) {
    await expectOnce(statement, text);
  }
  await expect(statement.getByRole("link", { name: link.label, exact: true })).toHaveCount(1);
});

test("Flavour grid Copy, with the disclosure beside the introduction", async ({ page }) => {
  const grid = page.getByRole("region", { name: copy.grid.heading, exact: true });
  await expectOnce(grid, copy.grid.heading);
  await expectOnce(grid, copy.grid.intro);
  await expectOnce(grid, copy.grid.disclosure);

  const intro = await grid.getByText(copy.grid.intro, { exact: true }).boundingBox();
  const disclosure = await grid.getByText(copy.grid.disclosure, { exact: true }).boundingBox();
  const cards = await grid.getByRole("list").boundingBox();
  // Next to the introduction: before the cards, and no further than a line below the intro.
  expect(disclosure!.y).toBeLessThan(cards!.y);
  expect(disclosure!.y).toBeLessThan(intro!.y + intro!.height + 40);
});

test("each Flavour card shows its name, descriptor, stats, size and default pack", async ({ page }) => {
  for (const flavour of flavours) {
    const card = page.getByRole("article", { name: flavourTitle(flavour) });
    await expect(card.getByRole("heading", { level: 3, name: flavourTitle(flavour) })).toBeVisible();
    for (const text of [flavour.descriptor, flavourStats(flavour), copy.grid.perCan, packLabel(defaultPack)]) {
      await expectOnce(card, text);
    }
  }
});

test("footer Copy", async ({ page }) => {
  const footer = page.getByRole("contentinfo");
  await expectOnce(footer, copy.footer.wordmark);
  await expectOnce(footer, copy.footer.tagline);
  await expectOnce(footer, copy.footer.disclosure);
  for (const link of copy.footer.nav) {
    await expect(footer.getByRole("link", { name: link.label, exact: true })).toHaveCount(1);
  }
});
