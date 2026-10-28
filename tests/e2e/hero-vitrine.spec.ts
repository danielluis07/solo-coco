import { expect, test, type Browser, type Page } from "@playwright/test";
import { anchors, copy } from "@/content/page";

// The Vitrine choreography outside Static: the Copy and badges move around the
// pinned object as scroll scrubs the Beats. Rules live in DESIGN.md
// § Hero choreography: Vitrine and § Accessibility.

const { opening, opened, transformation, rotatingCan } = copy.hero;

const stage = (page: Page) => page.locator("[data-hero-stage]");
const hero = (page: Page) => page.getByRole("region", { name: opening.headline, exact: true });
const piece = (page: Page, beat: string) => page.locator(`[data-vitrine="${beat}"]`);

const expect3d = (page: Page) =>
  expect(stage(page)).toHaveAttribute("data-hero-stage", "3d", { timeout: 15_000 });

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

/** How opaque each element of a Beat's Copy is right now. */
const opacities = (page: Page, beat: string) =>
  piece(page, beat).evaluateAll((els) => els.map((el) => Math.round(Number(getComputedStyle(el).opacity) * 100) / 100));

const shown = (page: Page, beat: string) => opacities(page, beat).then((values) => values.every((v) => v === 1));
const hidden = (page: Page, beat: string) => opacities(page, beat).then((values) => values.every((v) => v === 0));

async function phone(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  return { context, page: await context.newPage() };
}

/** Counts React commits through the DevTools hook, which production React also reports to. */
async function countCommits(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { commits: number; __REACT_DEVTOOLS_GLOBAL_HOOK__: unknown };
    w.commits = 0;
    w.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      renderers: new Map(),
      supportsFiber: true,
      inject: () => 1,
      checkDCE: () => {},
      onScheduleFiberRoot: () => {},
      onCommitFiberRoot: () => {
        w.commits += 1;
      },
      onCommitFiberUnmount: () => {},
      onPostCommitFiberRoot: () => {},
    };
  });
  return () => page.evaluate(() => (window as unknown as { commits: number }).commits);
}

test("all seven Beats play in order and reverse cleanly on scroll-up", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect3d(page);

  const beats: [number, () => Promise<void>][] = [
    // Girar: the intro composition, then on its way out.
    [2, async () => expect.poll(() => shown(page, "intro")).toBe(true)],
    // Facão: the split headline around the open coconut; the intro is gone.
    [
      34,
      async () => {
        await expect.poll(() => shown(page, "opened")).toBe(true);
        await expect.poll(() => hidden(page, "intro")).toBe(true);
      },
    ],
    // Selos: the badges are on their way up through the frame.
    [
      46,
      async () => {
        await expect(piece(page, "badge").first()).toBeInViewport();
      },
    ],
    // Fechar: the headline and badges have gone.
    [60, async () => expect.poll(() => hidden(page, "opened")).toBe(true)],
    // Virar lata: the meter counts.
    [
      70,
      async () => {
        await expect.poll(() => shown(page, "meter")).toBe(true);
        await expect(piece(page, "meter")).toContainText(/0[0-9][1-9]|0[1-9]0/);
      },
    ],
    // Lata gira: the closing Copy is in.
    [88, async () => expect.poll(() => shown(page, "closing")).toBe(true)],
    // Saída: the Fibra panel covers the frame.
    [
      100,
      async () => {
        await expect.poll(async () => (await piece(page, "panel").boundingBox())!.y).toBeLessThanOrEqual(1);
      },
    ],
  ];

  for (const [unit, check] of beats) {
    await scrollToUnit(page, unit);
    await check();
  }
  for (const [unit, check] of beats.toReversed()) {
    await scrollToUnit(page, unit);
    await check();
  }
});

test("the meter counts 000 → 100 through its three labels", async ({ page }) => {
  await page.goto("/");
  await expect3d(page);
  const meter = piece(page, "meter");
  for (const [unit, count, label] of [
    [59, "000", transformation.meterLabels[0]],
    [68, null, transformation.meterLabels[1]],
    [76, "100", transformation.meterLabels[2]],
  ] as const) {
    await scrollToUnit(page, unit);
    if (count) await expect(meter).toContainText(count);
    await expect(meter).toContainText(label);
  }
});

test("the split headline and the badges sit on both sides of the object", async ({ page }) => {
  await page.goto("/");
  await expect3d(page);
  const z = (selector: string) =>
    page.locator(selector).evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).zIndex)));
  const [object] = await z("[data-hero-stage]");
  const [back, front] = await z('[data-vitrine="opened"]');
  expect(back).toBeLessThan(object);
  expect(front).toBeGreaterThan(object);
  // The middle badge passes behind the coconut, the other two in front.
  const [first, middle, last] = await z('[data-vitrine="badge"]');
  expect(middle).toBeLessThan(object);
  expect(first).toBeGreaterThan(object);
  expect(last).toBeGreaterThan(object);
});

test("the Saída panel runs into the brand statement with no seam", async ({ page }) => {
  await page.goto("/");
  await expect3d(page);
  await scrollToUnit(page, 100);
  await expect.poll(async () => (await piece(page, "panel").boundingBox())!.y).toBeLessThanOrEqual(1);
  // Past the pin, the panel and the statement scroll on together.
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(1_000);

  const join = await page.evaluate((id) => {
    const panel = document.querySelector<HTMLElement>('[data-vitrine="panel"]')!;
    const statement = document.getElementById(id)!;
    const look = (el: HTMLElement) => {
      const style = getComputedStyle(el);
      return { color: style.backgroundColor, grain: style.backgroundImage };
    };
    // Whatever the statement paints above its top edge must not show over the panel.
    const above = Array.from(statement.children).filter((child) => {
      const box = child.getBoundingClientRect();
      return box.height > 0 && box.top < statement.getBoundingClientRect().top;
    }).length;
    return {
      gap: statement.getBoundingClientRect().top - panel.getBoundingClientRect().bottom,
      panel: look(panel),
      statement: look(statement),
      above,
    };
  }, anchors.statement);

  expect(Math.abs(join.gap)).toBeLessThanOrEqual(1);
  expect(join.panel).toEqual(join.statement);
  expect(join.above).toBe(0);
});

test("the accessible tree is the same as in Static, with the counter hidden", async ({ browser }) => {
  const still = await browser.newPage();
  await still.emulateMedia({ reducedMotion: "reduce" });
  await still.goto("/");
  await expect(still.locator("html")).toHaveAttribute("data-motion-tier", "static");
  const expected = await hero(still).ariaSnapshot();

  const page = await browser.newPage();
  await page.goto("/");
  await expect3d(page);
  for (const unit of [0, 30, 70, 90]) {
    await scrollToUnit(page, unit);
    await page.waitForTimeout(1_500);
    expect(await hero(page).ariaSnapshot(), `at unit ${unit}`).toBe(expected);
  }
  // The counter's digits are never exposed; the meter labels are, once each.
  expect(expected).not.toMatch(/\b(0\d\d|100)\b/);
  for (const label of transformation.meterLabels) expect(expected.split(label).length - 1).toBe(1);
  // Nothing decorative takes focus.
  expect(await page.locator('[aria-hidden="true"] :is(a, button, [tabindex])').count()).toBe(0);
});

test("scrolling through the Hero causes no React re-renders", async ({ page }) => {
  test.setTimeout(60_000);
  const commits = await countCommits(page);
  await page.goto("/");
  await expect3d(page);
  await page.waitForTimeout(1_000);
  const before = await commits();
  // The hook is live: loading and the first 3D frame committed.
  expect(before).toBeGreaterThan(0);
  const tier = await page.locator("html").getAttribute("data-motion-tier");

  for (const unit of [10, 30, 50, 70, 90, 100, 60, 20, 0]) {
    await scrollToUnit(page, unit);
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(1_500);
  // A tier change re-renders by design; it would make this run say nothing about scrolling.
  await expect(page.locator("html")).toHaveAttribute("data-motion-tier", tier!);
  expect(await commits()).toBe(before);
});

test.describe("Estreita, on a phone", () => {
  test("the object is about 60% of the width, slightly below centre, with 104 px badges and a full-width meter", async ({
    browser,
  }) => {
    const { context, page } = await phone(browser);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion-tier", "lite");
    await expect3d(page);

    const poster = (await stage(page).locator("[data-hero-poster]").boundingBox())!;
    // The coconut fills about 84% of its square.
    expect((poster.width * 0.84) / 390).toBeGreaterThan(0.55);
    expect((poster.width * 0.84) / 390).toBeLessThan(0.65);
    expect(poster.y + poster.height / 2).toBeGreaterThan(844 / 2);

    for (const badge of await piece(page, "badge").all()) {
      // Measured untilted: a tilted badge's bounding box is wider than the badge.
      expect(await badge.evaluate((el: HTMLElement) => el.offsetWidth)).toBe(104);
    }
    const meter = (await piece(page, "meter").boundingBox())!;
    expect(meter.x).toBeCloseTo(20, 0);
    expect(meter.width).toBeCloseTo(390 - 40, 0);
    await context.close();
  });

  test("the split headlines go above and below the object", async ({ browser }) => {
    const { context, page } = await phone(browser);
    await page.goto("/");
    await expect3d(page);
    await scrollToUnit(page, 34);
    await expect.poll(() => shown(page, "opened")).toBe(true);
    const poster = (await stage(page).locator("[data-hero-poster]").boundingBox())!;
    const [above, below] = await Promise.all(
      (await piece(page, "opened").all()).map(async (line) => (await line.boundingBox())!),
    );
    expect(above.y + above.height).toBeLessThan(poster.y + poster.height / 2);
    expect(above.x).toBeLessThan(390 / 2);
    expect(below.y).toBeGreaterThan(poster.y + poster.height / 2);
    expect(below.x + below.width).toBeGreaterThan(390 / 2);
    await context.close();
  });

  test("every Beat fits the screen", async ({ browser }) => {
    test.setTimeout(60_000);
    const { context, page } = await phone(browser);
    await page.goto("/");
    await expect3d(page);
    for (const [unit, beat] of [
      [2, "intro"],
      [34, "opened"],
      [70, "meter"],
      [90, "closing"],
    ] as const) {
      await scrollToUnit(page, unit);
      await expect.poll(() => shown(page, beat), `${beat} at ${unit}`).toBe(true);
      for (const box of await piece(page, beat).evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect),
      )) {
        expect(box.left, `${beat} at ${unit}`).toBeGreaterThanOrEqual(0);
        expect(box.right, `${beat} at ${unit}`).toBeLessThanOrEqual(390);
        expect(box.top, `${beat} at ${unit}`).toBeGreaterThanOrEqual(0);
        expect(box.bottom, `${beat} at ${unit}`).toBeLessThanOrEqual(844);
      }
    }
    await context.close();
  });

  test("the pin adds about 6 screens of scroll", async ({ browser }) => {
    const { context, page } = await phone(browser);
    await page.goto("/");
    await expect(page.locator("[data-hero-stage]")).toHaveAttribute("data-pinned", "true");
    const added = await page.evaluate(() => {
      const row = document.querySelector<HTMLElement>("[data-hero-pin]")!;
      return (row.parentElement!.offsetHeight - row.offsetHeight) / innerHeight;
    });
    expect(added).toBeCloseTo(6, 1);
    await context.close();
  });
});

test("the intro composition is the first paint: “Só o coco.” with its underline and the corner lines", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-hero-layout", "vitrine");
  const h1 = page.getByRole("heading", { level: 1, name: opening.headline });
  await expect(h1).toBeInViewport();
  for (const line of [opening.corner, opening.oppositeCorner]) {
    await expect(hero(page).getByText(line, { exact: true })).toBeInViewport();
  }
  // Waiting Copy is not painted yet.
  for (const text of [...opened.headline, rotatingCan.headline]) {
    await expect(hero(page).getByText(text, { exact: true })).toHaveCSS("opacity", "0");
  }
});
