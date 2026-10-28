import { expect, test, type Locator, type Page } from "@playwright/test";
import { copy, defaultPack, flavours, flavourTitle, packLabel, packs, quickAddAnnouncement } from "@/content/page";

const [one, six, twelve] = packs;
const [first, second] = flavours;

const card = (page: Page, flavour = first) => page.getByRole("article", { name: flavourTitle(flavour) });
const opener = (card: Locator) => card.getByRole("button", { name: copy.quickAdd.open, exact: true });
const picker = (card: Locator) => card.getByRole("group", { name: copy.quickAdd.heading });
const radio = (card: Locator, pack = one) => card.getByRole("radio", { name: packLabel(pack), exact: true });

/** Every text the status region has held since the page loaded, in order. */
const announcements = (page: Page) => page.evaluate(() => (window as unknown as { said: string[] }).said);

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const said: string[] = [];
    (window as unknown as { said: string[] }).said = said;
    const status = document.querySelector("[data-quick-add-status]")!;
    new MutationObserver(() => said.push(status.textContent ?? "")).observe(status, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
});

/** Opens a card's picker by pointer, retrying until hydration has wired the button. */
async function openByClick(c: Locator) {
  await expect(async () => {
    await opener(c).click();
    await expect(picker(c)).toBeVisible({ timeout: 500 });
  }).toPass();
}

test("each card starts on the default pack with a closed picker", async ({ page }) => {
  const c = card(page);
  await expect(c.getByText(packLabel(defaultPack), { exact: true })).toBeVisible();
  await expect(opener(c)).toHaveAttribute("aria-expanded", "false");
  await expect(picker(c)).toHaveCount(0);
  await expect(page.getByRole("status")).toBeEmpty();
});

test("“Escolher” opens a labelled inline picker and focuses the selected radio", async ({ page }) => {
  const c = card(page);
  await openByClick(c);

  await expect(opener(c)).toHaveAttribute("aria-expanded", "true");
  await expect(radio(c, one)).toBeFocused();
  await expect(radio(c, one)).toBeChecked();
  await expect(picker(c).getByRole("radio")).toHaveCount(3);
  await expect(c.getByText(copy.quickAdd.helper, { exact: true })).toBeVisible();
  await expect(c.getByRole("button", { name: copy.quickAdd.close, exact: true })).toBeVisible();
  // Product details stay visible.
  await expect(c.getByText(first.descriptor, { exact: true })).toBeVisible();
  await expect(c.getByRole("heading", { level: 3 })).toBeVisible();
});

test("picking a different pack by pointer updates the card, closes and announces once", async ({ page }) => {
  const c = card(page);
  await openByClick(c);
  await c.getByText(packLabel(six), { exact: true }).click();

  await expect(picker(c)).toHaveCount(0);
  await expect(opener(c)).toBeFocused();
  await expect(opener(c)).toHaveAttribute("aria-expanded", "false");
  await expect(c.getByText(packLabel(six), { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(quickAddAnnouncement(first, six));
  await expect(page.getByRole("status")).toHaveAttribute("aria-live", "polite");
  expect(await announcements(page)).toEqual([quickAddAnnouncement(first, six)]);
});

test("keyboard: arrows browse, Enter or Space picks, focus returns to “Escolher”", async ({ page }) => {
  const c = card(page);
  await openByClick(c);
  await expect(radio(c, one)).toBeFocused();

  // Arrow keys move through the native radios without committing.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(radio(c, twelve)).toBeFocused();
  await expect(radio(c, twelve)).toBeChecked();
  await expect(picker(c)).toBeVisible();
  expect(await announcements(page)).toEqual([]);

  await page.keyboard.press("Enter");
  await expect(picker(c)).toHaveCount(0);
  await expect(opener(c)).toBeFocused();
  await expect(c.getByText(packLabel(twelve), { exact: true })).toBeVisible();
  expect(await announcements(page)).toEqual([quickAddAnnouncement(first, twelve)]);

  // Reopening from the keyboard lands on the new selection; Space picks too.
  await page.keyboard.press("Enter");
  await expect(radio(c, twelve)).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");
  await expect(opener(c)).toBeFocused();
  await expect(c.getByText(packLabel(six), { exact: true })).toBeVisible();
  expect(await announcements(page)).toEqual([
    quickAddAnnouncement(first, twelve),
    quickAddAnnouncement(first, six),
  ]);
});

test("re-selecting the current pack just closes, with no announcement", async ({ page }) => {
  const c = card(page);
  await openByClick(c);
  await c.getByText(packLabel(one), { exact: true }).last().click();
  await expect(picker(c)).toHaveCount(0);
  await expect(opener(c)).toBeFocused();

  await opener(c).press("Enter");
  await expect(radio(c, one)).toBeFocused();
  await page.keyboard.press("Space");
  await expect(picker(c)).toHaveCount(0);
  await expect(opener(c)).toBeFocused();
  expect(await announcements(page)).toEqual([]);
});

test("Escape closes without changing the selection, even after browsing", async ({ page }) => {
  const c = card(page);
  await openByClick(c);
  await page.keyboard.press("ArrowDown");
  await expect(radio(c, six)).toBeChecked();
  await page.keyboard.press("Escape");

  await expect(picker(c)).toHaveCount(0);
  await expect(opener(c)).toBeFocused();
  await expect(c.getByText(packLabel(one), { exact: true })).toBeVisible();
  expect(await announcements(page)).toEqual([]);

  await page.keyboard.press("Enter");
  await expect(radio(c, one)).toBeChecked();
  await expect(radio(c, one)).toBeFocused();
});

test("“Fechar” closes without changing the selection", async ({ page }) => {
  const c = card(page);
  await openByClick(c);
  await page.keyboard.press("ArrowDown");
  await c.getByRole("button", { name: copy.quickAdd.close, exact: true }).click();

  await expect(picker(c)).toHaveCount(0);
  await expect(opener(c)).toBeFocused();
  await expect(c.getByText(packLabel(one), { exact: true })).toBeVisible();
  expect(await announcements(page)).toEqual([]);
});

test("opening another card's picker closes the first and keeps its selection", async ({ page }) => {
  const a = card(page, first);
  const b = card(page, second);
  await openByClick(a);
  await a.getByText(packLabel(six), { exact: true }).click();
  await opener(a).click();
  await expect(picker(a)).toBeVisible();

  await opener(b).click();
  await expect(picker(a)).toHaveCount(0);
  await expect(picker(b)).toBeVisible();
  await expect(radio(b, one)).toBeFocused();
  await expect(page.getByRole("group", { name: copy.quickAdd.heading })).toHaveCount(1);
  await expect(a.getByText(packLabel(six), { exact: true })).toBeVisible();
});

test("an outside click closes without stealing focus from what was clicked", async ({ page }) => {
  const c = card(page);

  // Plain text: closes, and focus is not pulled back to “Escolher”.
  await openByClick(c);
  await page.getByText(copy.grid.intro, { exact: true }).click();
  await expect(picker(c)).toHaveCount(0);
  await expect(opener(c)).not.toBeFocused();

  // A control elsewhere gets its click: another card's picker opens and takes focus.
  await openByClick(c);
  await opener(card(page, second)).click();
  await expect(picker(c)).toHaveCount(0);
  await expect(picker(card(page, second))).toBeVisible();
  await expect(radio(card(page, second), one)).toBeFocused();
  expect(await announcements(page)).toEqual([]);
});

test("tabbing out closes the picker without moving focus", async ({ page }) => {
  const c = card(page);
  await openByClick(c);

  // Forwards: radio → Fechar → next card's “Escolher”.
  await page.keyboard.press("Tab");
  await expect(c.getByRole("button", { name: copy.quickAdd.close, exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(picker(c)).toHaveCount(0);
  await expect(opener(card(page, second))).toBeFocused();

  // Backwards: radio → this card's “Escolher”, which stays focused.
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  await expect(radio(c, one)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(picker(c)).toHaveCount(0);
  await expect(opener(c)).toBeFocused();
  expect(await announcements(page)).toEqual([]);
});

test("every control is at least 44 px tall", async ({ page }) => {
  const c = card(page);
  await openByClick(c);
  const controls = [
    opener(c),
    c.getByRole("button", { name: copy.quickAdd.close, exact: true }),
    ...packs.map((p) => picker(c).locator("label").filter({ hasText: packLabel(p) })),
  ];
  for (const control of controls) {
    const box = await control.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  // Full-width rows.
  const row = await picker(c).locator("label").first().boundingBox();
  const group = await picker(c).boundingBox();
  expect(row!.width).toBeGreaterThanOrEqual(group!.width - 1);
});

test("revealed content fades in over 180 ms", async ({ page }) => {
  const c = card(page);
  await openByClick(c);
  const board = page.locator(`#${await opener(c).getAttribute("aria-controls")}`);
  await expect(board).toHaveCSS("animation-name", "fade-in");
  await expect(board).toHaveCSS("animation-duration", "0.18s");
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
  await opener(c).focus();
  await expect(c).toHaveCSS("rotate", "0deg");
});

test("reduced motion: untilted cards and no transitions, same behaviour", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const c = card(page);
  await expect(c).toHaveCSS("rotate", "none");
  await expect(c).toHaveCSS("transition-duration", "0s");

  await openByClick(c);
  const board = page.locator(`#${await opener(c).getAttribute("aria-controls")}`);
  await expect(board).toHaveCSS("animation-name", "none");
  await expect(radio(c, one)).toBeFocused();
  await c.getByText(packLabel(six), { exact: true }).click();
  await expect(c.getByText(packLabel(six), { exact: true })).toBeVisible();
  await context.close();
});

test("touch: the first tap opens the picker and the next picks", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  const c = card(page);
  await expect(async () => {
    await opener(c).tap();
    await expect(picker(c)).toBeVisible({ timeout: 500 });
  }).toPass();
  await c.getByText(packLabel(twelve), { exact: true }).tap();
  await expect(picker(c)).toHaveCount(0);
  await expect(c.getByText(packLabel(twelve), { exact: true })).toBeVisible();
  await context.close();
});

test("selections are kept per Flavour and reset on reload", async ({ page }) => {
  const a = card(page, first);
  const b = card(page, second);
  await openByClick(a);
  await a.getByText(packLabel(six), { exact: true }).click();
  await openByClick(b);
  await b.getByText(packLabel(twelve), { exact: true }).click();
  await expect(a.getByText(packLabel(six), { exact: true })).toBeVisible();
  await expect(b.getByText(packLabel(twelve), { exact: true })).toBeVisible();

  await page.reload();
  for (const c of [a, b]) {
    await expect(c.getByText(packLabel(defaultPack), { exact: true })).toBeVisible();
  }
});

test("nothing is bought: Quick-add makes no network requests", async ({ page }) => {
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  const c = card(page);
  await openByClick(c);
  await c.getByText(packLabel(twelve), { exact: true }).click();
  await expect(c.getByText(packLabel(twelve), { exact: true })).toBeVisible();
  expect(requests).toEqual([]);
});
