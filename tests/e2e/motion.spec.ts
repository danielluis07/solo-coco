import { expect, test, type Locator, type Page } from "@playwright/test";
import { copy, flavours, flavourTitle, packLabel, defaultPack } from "@/content/page";

const html = (page: Page) => page.locator("html");
const toggle = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: copy.header.motionOff, exact: true });

/** Waits until the controller has read the browser and published a tier. */
async function expectTier(page: Page, tier: "static" | "moving") {
  if (tier === "static") await expect(html(page)).toHaveAttribute("data-motion-tier", "static");
  else await expect(html(page)).toHaveAttribute("data-motion-tier", /^(full|lite)$/);
}

/** Lenis marks <html> while it runs; this also records whether it ever did. */
async function watchLenis(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { lenisSeen: boolean };
    w.lenisSeen = false;
    new MutationObserver(() => {
      if (document.documentElement.classList.contains("lenis")) w.lenisSeen = true;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  });
}
const lenisSeen = (page: Page) => page.evaluate(() => (window as unknown as { lenisSeen: boolean }).lenisSeen);

test.beforeEach(async ({ page }) => {
  await watchLenis(page);
});

test("reduced motion makes the page Static before Lenis loads", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expectTier(page, "static");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(html(page)).not.toHaveClass(/\blenis\b/);
  expect(await lenisSeen(page)).toBe(false);
});

test("outside Static, Lenis runs", async ({ page }) => {
  await page.goto("/");
  await expectTier(page, "moving");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(html(page)).toHaveClass(/\blenis\b/);
});

test("“Desativar animações” switches to Static, keeps focus and position, and lasts the visit", async ({ page }) => {
  await page.goto("/");
  await expectTier(page, "moving");
  await expect(html(page)).toHaveClass(/\blenis\b/);

  // It is the first stop in keyboard order.
  await page.keyboard.press("Tab");
  await expect(toggle(page)).toBeFocused();
  const before = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("Enter");

  await expectTier(page, "static");
  await expect(html(page)).not.toHaveClass(/\blenis\b/);
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(toggle(page)).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(before);

  await page.reload();
  await expectTier(page, "static");
  expect(await lenisSeen(page)).toBe(false);
});

test("turning on reduced motion mid-visit switches to Static and keeps focus and position", async ({ page }) => {
  await page.goto("/");
  await expectTier(page, "moving");
  await expect(html(page)).toHaveClass(/\blenis\b/);

  const opener = page.getByRole("contentinfo").getByRole("link", { name: "Voltar ao topo", exact: true });
  await opener.focus();
  await expect(opener).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  // Releasing the statement pin shortens the page above, so the footer link's place
  // in the viewport is what stays, not the scroll offset.
  const before = (await opener.boundingBox())!.y;

  await page.emulateMedia({ reducedMotion: "reduce" });

  await expectTier(page, "static");
  await expect(html(page)).not.toHaveClass(/\blenis\b/);
  await expect(opener).toBeFocused();
  expect(Math.abs((await opener.boundingBox())!.y - before)).toBeLessThanOrEqual(1);
});

const anchorLinks = (page: Page): [string, Locator, string][] => {
  const banner = page.getByRole("banner");
  const main = page.getByRole("main");
  const footer = page.getByRole("contentinfo");
  const statement = copy.statement.headline;
  const grid = copy.grid.heading;
  const top = copy.hero.opening.headline;
  return [
    ["header “O coco”", banner.getByRole("link", { name: "O coco", exact: true }), statement],
    ["header “Sabores”", banner.getByRole("link", { name: "Sabores", exact: true }), grid],
    ["header “Ver sabores”", banner.getByRole("link", { name: "Ver sabores", exact: true }), grid],
    ["Hero “Escolha seu coco”", main.getByRole("link", { name: "Escolha seu coco", exact: true }).first(), grid],
    ["statement “Escolha seu coco”", main.getByRole("link", { name: "Escolha seu coco", exact: true }).last(), grid],
    ["footer “O coco”", footer.getByRole("link", { name: "O coco", exact: true }), statement],
    ["footer “Sabores”", footer.getByRole("link", { name: "Sabores", exact: true }), grid],
    ["footer “Voltar ao topo”", footer.getByRole("link", { name: "Voltar ao topo", exact: true }), top],
  ];
};

for (const tier of ["static", "moving"] as const) {
  test(`every anchor focuses its destination heading (${tier})`, async ({ page }) => {
    if (tier === "static") await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expectTier(page, tier);
    if (tier === "moving") await expect(html(page)).toHaveClass(/\blenis\b/);

    for (const [name, link, heading] of anchorLinks(page)) {
      // Outside Static the Hero's link shows with the intro, at the top of the Vitrine,
      // which a scroll to its place in the layout would not bring back. Lenis finishes
      // the last glide first, as it would override a jump made mid-glide.
      if (tier === "moving" && name.startsWith("Hero")) {
        await expect(html(page)).not.toHaveClass(/\blenis-scrolling\b/);
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      }
      await link.click();
      const destination = page.getByRole("heading", { name: heading, exact: true });
      await expect(destination, name).toBeFocused();
      await expect(destination, name).toBeInViewport();
    }
  });
}

test("keyboard activation of an anchor focuses its heading", async ({ page }) => {
  await page.goto("/");
  await expectTier(page, "moving");
  await page.getByRole("banner").getByRole("link", { name: "Ver sabores", exact: true }).press("Enter");
  await expect(page.getByRole("heading", { name: copy.grid.heading, exact: true })).toBeFocused();
  await expect(page).toHaveURL(/#sabores$/);
});

test("Flavour prices remain visible after a forced tier change", async ({ page }) => {
  await page.goto("/");
  await expectTier(page, "moving");
  const card = page.getByRole("article", { name: flavourTitle(flavours[0]) });
  await expect(card.getByText(packLabel(defaultPack), { exact: true })).toBeVisible();
  await toggle(page).click();
  await expectTier(page, "static");
  await expect(card.getByText(packLabel(defaultPack), { exact: true })).toBeVisible();
});
