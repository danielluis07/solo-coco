import { expect, test, type Browser, type Page, type Route } from "@playwright/test";
import { copy } from "@/content/page";

// The live Hero in headless Chromium, which renders WebGL in software (SwiftShader).
// Rules live in DESIGN.md § Performance, loading and runtime fallbacks.

const html = (page: Page) => page.locator("html");
const stage = (page: Page) => page.locator("[data-hero-stage]");
const canvas = (page: Page) => stage(page).locator("canvas");
const toggle = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: copy.header.motionOff, exact: true });

async function expectTier(page: Page, tier: "static" | "full" | "lite" | "moving") {
  const value = tier === "moving" ? /^(full|lite)$/ : tier;
  await expect(html(page)).toHaveAttribute("data-motion-tier", value);
}

const expect3d = (page: Page, timeout = 15_000) =>
  expect(stage(page)).toHaveAttribute("data-hero-stage", "3d", { timeout });

/** Holds a Hero model until `release` is called, as on a slow network. */
async function holdAsset(page: Page, path: string) {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  let requests = 0;
  await page.route(`**${path}`, async (route: Route) => {
    requests += 1;
    await released;
    await route.continue().catch(() => {});
  });
  return { release, requests: () => requests };
}

/** Scrolls to a point in the pinned Hero's range, in timeline units 0–100. */
async function scrollToUnit(page: Page, unit: number) {
  await page.evaluate((u) => {
    const row = document.querySelector<HTMLElement>("[data-hero-pin]")!;
    const spacer = row.parentElement!.classList.contains("pin-spacer") ? row.parentElement! : row;
    const top = spacer.getBoundingClientRect().top + scrollY;
    const start = top + row.offsetHeight / 2 - innerHeight / 2;
    const length = spacer.offsetHeight - row.offsetHeight;
    window.scrollTo({ top: start + (length * u) / 100, behavior: "instant" });
  }, unit);
}

/** The pinned stage is in place and holding still. */
async function pinnedStageTop(page: Page) {
  await expect(stage(page)).toHaveAttribute("data-pinned", "true");
  await expect(page.locator(".pin-spacer [data-hero-pin]")).toHaveCount(1);
  return (await stage(page).boundingBox())!.y;
}

async function phone(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  return { context, page: await context.newPage() };
}

test("Lite reaches a first 3D frame in software WebGL, at a pixel ratio of 1", async ({ browser }) => {
  const { context, page } = await phone(browser);
  await page.goto("/");
  await expectTier(page, "lite");
  await expect3d(page);

  const size = await canvas(page).evaluate((el: HTMLCanvasElement) => ({
    width: el.width,
    css: el.getBoundingClientRect().width,
  }));
  expect(size.width).toBeGreaterThan(0);
  expect(size.width).toBe(Math.round(size.css));
  await context.close();
});

test("the canvas is hidden from assistive technology and never takes focus", async ({ page }) => {
  await page.goto("/");
  await expect3d(page);
  await expect(canvas(page).locator("xpath=ancestor::*[@aria-hidden='true']")).toHaveCount(1);
  expect(await canvas(page).evaluate((el) => el.tabIndex)).toBe(-1);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("CANVAS");
  }
});

test("the poster-to-canvas swap shifts nothing", async ({ page }) => {
  const coconut = await holdAsset(page, "/hero/coconut.glb");
  await page.goto("/");
  await expectTier(page, "moving");
  await expect(stage(page)).toHaveAttribute("data-pinned", "true");
  await expect(stage(page)).toHaveAttribute("data-hero-stage", "poster");
  const before = await stage(page).boundingBox();
  await page.evaluate(() => {
    const w = window as unknown as { shifts: number };
    w.shifts = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) w.shifts += (entry as unknown as { value: number }).value;
    }).observe({ type: "layout-shift" });
  });

  coconut.release();
  await expect3d(page);
  await page.waitForTimeout(500);
  expect(await stage(page).boundingBox()).toEqual(before);
  expect(await page.evaluate(() => (window as unknown as { shifts: number }).shifts)).toBe(0);
});

test("with WebGL unavailable the page is Static", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.includes("webgl")) return null;
      return getContext.apply(this, [type, ...rest] as never);
    } as typeof getContext;
  });
  let modelRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/hero/") && !request.url().includes("poster")) modelRequests += 1;
  });
  await page.goto("/");
  await expectTier(page, "static");
  await expect(stage(page).locator("img")).toBeVisible();
  await expect(canvas(page)).toHaveCount(0);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  expect(modelRequests).toBe(0);
});

test("an essential asset failure leaves the page Static, with no modal and no retry", async ({ page }) => {
  page.on("dialog", () => {
    throw new Error("No dialog may open");
  });
  let requests = 0;
  await page.route("**/hero/can.glb", (route) => {
    requests += 1;
    return route.abort();
  });
  await page.goto("/");
  await expectTier(page, "static");
  await expect(stage(page)).toHaveAttribute("data-hero-stage", "poster");
  await expect(stage(page).locator("img")).toBeVisible();
  await expect(canvas(page)).toHaveCount(0);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await page.waitForTimeout(1_000);
  expect(requests).toBe(1);
});

test("no first 3D frame within 12 s leaves the page Static, with no retry", async ({ page }) => {
  test.setTimeout(40_000);
  const coconut = await holdAsset(page, "/hero/coconut.glb");
  await page.goto("/");
  await expectTier(page, "moving");
  await expect(stage(page)).toHaveAttribute("data-hero-stage", "poster");
  await page.waitForTimeout(10_000);
  await expectTier(page, "moving");

  await expectTier(page, "static");
  await expect(stage(page).locator("img")).toBeVisible();
  // A late model is ignored.
  coconut.release();
  await page.waitForTimeout(1_000);
  await expectTier(page, "static");
  await expect(canvas(page)).toHaveCount(0);
  expect(coconut.requests()).toBe(1);
});

test("losing the WebGL context mid-scroll switches to Static, releases the pin and keeps the visitor's place", async ({
  page,
}) => {
  await page.goto("/");
  await expect3d(page);
  await scrollToUnit(page, 40);
  await page.waitForTimeout(1_500);
  const top = await pinnedStageTop(page);

  await canvas(page).evaluate((el: HTMLCanvasElement) => {
    const gl = el.getContext("webgl2") ?? el.getContext("webgl");
    gl!.getExtension("WEBGL_lose_context")!.loseContext();
  });

  await expectTier(page, "static");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(stage(page)).toHaveAttribute("data-hero-stage", "poster");
  await expect(stage(page).locator("img")).toBeInViewport();
  expect(Math.abs((await stage(page).boundingBox())!.y - top)).toBeLessThanOrEqual(1);
});

test("“Desativar animações” midway through the pinned Hero releases the pin and keeps position and focus", async ({
  page,
}) => {
  await page.goto("/");
  await expect3d(page);
  await scrollToUnit(page, 30);
  await page.waitForTimeout(1_500);
  const top = await pinnedStageTop(page);

  // The header is not sticky; a screen-reader or keyboard user reaches it without moving the page.
  await toggle(page).evaluate((el: HTMLElement) => el.focus({ preventScroll: true }));
  await page.keyboard.press("Enter");

  await expectTier(page, "static");
  await expect(toggle(page)).toBeFocused();
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(canvas(page)).toHaveCount(0);
  expect(Math.abs((await stage(page).boundingBox())!.y - top)).toBeLessThanOrEqual(1);
});

test("scrolling past the Hero before 3D is ready keeps the visitor's position and skips the entrance", async ({
  page,
}) => {
  const coconut = await holdAsset(page, "/hero/coconut.glb");
  await page.goto("/");
  await expect(stage(page)).toHaveAttribute("data-entrance", "playing");

  const heading = page.getByRole("heading", { name: copy.grid.heading, exact: true });
  await heading.evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
  await expect(stage(page)).toHaveAttribute("data-entrance", "skipped");
  await page.waitForTimeout(1_500);
  const before = (await heading.boundingBox())!.y;

  coconut.release();
  await expect3d(page);
  await page.waitForTimeout(1_000);
  expect(Math.abs((await heading.boundingBox())!.y - before)).toBeLessThanOrEqual(1);
  await expect(stage(page)).toHaveAttribute("data-entrance", "skipped");
});

test("rendering pauses while the Hero is offscreen or the tab is hidden", async ({ page }) => {
  await page.goto("/");
  await expect3d(page);
  await expect(stage(page)).toHaveAttribute("data-rendering", "on");

  await page.getByRole("contentinfo").evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
  await expect(stage(page)).toHaveAttribute("data-rendering", "paused");

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(stage(page)).toHaveAttribute("data-rendering", "on");

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(stage(page)).toHaveAttribute("data-rendering", "paused");
});

test("two low-fps windows while the Hero animates step the tier down", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expectTier(page, "full");
  await expect3d(page);

  // A slow CPU, and a visitor scrubbing back and forth through Girar.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 20 });
  const deadline = Date.now() + 40_000;
  let unit = 2;
  while (Date.now() < deadline) {
    if ((await html(page).getAttribute("data-motion-tier")) !== "full") break;
    await scrollToUnit(page, unit);
    unit = unit === 2 ? 15 : 2;
    await page.waitForTimeout(300);
  }
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await expect(html(page)).not.toHaveAttribute("data-motion-tier", "full");
});
