import { expect, test, type Page } from "@playwright/test";
import { anchors, copy } from "@/content/page";

const { statement } = copy;

const html = (page: Page) => page.locator("html");
const section = (page: Page) => page.locator(`#${anchors.statement}`);
const pinned = (page: Page) => section(page).locator("[data-pinned]");
const heading = (page: Page) => page.getByRole("heading", { name: statement.headline, exact: true });
const statementLink = (page: Page) => section(page).getByRole("link", { name: statement.link.label, exact: true });

async function expectTier(page: Page, tier: "static" | "moving") {
  if (tier === "static") await expect(html(page)).toHaveAttribute("data-motion-tier", "static");
  else await expect(html(page)).toHaveAttribute("data-motion-tier", /^(full|lite)$/);
}

/** Where the statement starts and how much scroll the pin adds. */
function measure(page: Page) {
  return section(page).evaluate((el: HTMLElement) => {
    const content = el.querySelector<HTMLElement>("[data-pinned]")!.firstElementChild as HTMLElement;
    return {
      start: el.getBoundingClientRect().top + scrollY,
      added: el.offsetHeight - content.offsetHeight,
      viewport: innerHeight,
    };
  });
}

/** Scrolls to a point in the statement's own range, 0 to 1. */
async function scrollToProgress(page: Page, progress: number) {
  const { start, added } = await measure(page);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), start + added * progress);
}

/** The phrase painted at the plaque's centre, the one a sighted visitor sees. */
function plaquePhrase(page: Page) {
  return section(page)
    .locator('[aria-hidden="true"]', { hasText: statement.plaque[0] })
    .evaluate((plaque) => {
      const box = plaque.getBoundingClientRect();
      return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.textContent;
    });
}

const headingTop = async (page: Page) => (await heading(page).boundingBox())!.y;

/** How many times each phrase appears in the statement's accessibility tree. */
async function announcements(page: Page) {
  const tree = await section(page).ariaSnapshot();
  return statement.plaque.map((phrase) => tree.split(phrase).length - 1);
}

test("outside Static, the statement pins for 200 vh and cycles the plaque both ways", async ({ page }) => {
  await page.goto("/");
  await expectTier(page, "moving");
  await expect(pinned(page)).toHaveAttribute("data-pinned", "true");

  const { added, viewport } = await measure(page);
  expect(Math.abs(added - viewport * 2)).toBeLessThanOrEqual(1);

  await scrollToProgress(page, 0.1);
  await expect.poll(() => plaquePhrase(page)).toBe(statement.plaque[0]);
  const top = await headingTop(page);

  for (const [progress, phrase] of [
    [0.5, statement.plaque[1]],
    [0.9, statement.plaque[2]],
    [0.5, statement.plaque[1]],
    [0.1, statement.plaque[0]],
  ] as const) {
    await scrollToProgress(page, progress);
    await expect.poll(() => plaquePhrase(page), `at ${progress * 100}%`).toBe(phrase);
    // “Coco.”, the body, the closing line and the link hold still in view.
    expect(Math.abs((await headingTop(page)) - top)).toBeLessThanOrEqual(1);
    await expect(section(page).getByText(statement.body)).toBeInViewport();
    await expect(section(page).getByText(statement.closing)).toBeInViewport();
    await expect(statementLink(page)).toBeInViewport();
  }

  expect(await announcements(page)).toEqual([1, 1, 1]);
});

test("on a phone the pin adds 150 vh", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/");
  await expectTier(page, "moving");
  await expect(pinned(page)).toHaveAttribute("data-pinned", "true");
  const { added, viewport } = await measure(page);
  expect(Math.abs(added - viewport * 1.5)).toBeLessThanOrEqual(1);
  await context.close();
});

test("in Static nothing pins and all three phrases are text in flow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expectTier(page, "static");

  await expect(section(page).locator("[data-pinned], .pin-spacer")).toHaveCount(0);
  for (const phrase of statement.plaque) {
    await expect(section(page).getByRole("listitem").filter({ hasText: phrase })).toBeVisible();
  }
  expect(await announcements(page)).toEqual([1, 1, 1]);

  await heading(page).scrollIntoViewIfNeeded();
  const top = await headingTop(page);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => headingTop(page)).toBeLessThan(top - 100);
});

test("on a viewport too short for the content, the statement is not pinned", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 400 } });
  const page = await context.newPage();
  await page.goto("/");
  await expectTier(page, "moving");
  await expect(pinned(page)).toHaveAttribute("data-pinned", "false");
  await expect(section(page).locator(".pin-spacer")).toHaveCount(0);

  // Every part of it scrolls into view in turn.
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), (await measure(page)).start);
  const top = await headingTop(page);
  await statementLink(page).scrollIntoViewIfNeeded();
  await expect(statementLink(page)).toBeInViewport();
  expect(await headingTop(page)).toBeLessThan(top);
  await context.close();
});

test("entering Static mid-sequence releases the pin and keeps position and focus", async ({ page }) => {
  await page.goto("/");
  await expectTier(page, "moving");
  await expect(pinned(page)).toHaveAttribute("data-pinned", "true");

  await scrollToProgress(page, 0.5);
  await expect.poll(() => plaquePhrase(page)).toBe(statement.plaque[1]);
  await statementLink(page).focus();
  const top = await headingTop(page);

  await page.emulateMedia({ reducedMotion: "reduce" });

  await expectTier(page, "static");
  await expect(section(page).locator("[data-pinned], .pin-spacer")).toHaveCount(0);
  await expect(statementLink(page)).toBeFocused();
  await expect(statementLink(page)).toBeInViewport();
  expect(Math.abs((await headingTop(page)) - top)).toBeLessThanOrEqual(1);
});
