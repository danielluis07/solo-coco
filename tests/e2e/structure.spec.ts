import { expect, test, type Page } from "@playwright/test";
import { copy, flavours, flavourTitle } from "@/content/page";

const expectedOutline = [
  ["H1", copy.hero.opening.headline],
  ["H2", copy.statement.headline],
  ["H2", copy.grid.heading],
  ...flavours.map((f) => ["H3", flavourTitle(f)]),
];

function outline(page: Page) {
  return page
    .locator("h1, h2, h3, h4, h5, h6")
    .evaluateAll((els) => els.map((el) => [el.tagName, el.textContent!.replace(/\s+/g, " ").trim()]));
}

test("headings follow the reading order Hero → statement → grid", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  expect(await outline(page)).toEqual(expectedOutline);
});

test("landmarks run header → main (Hero, statement, grid) → footer", async ({ page }) => {
  await page.goto("/");
  const order = await page
    .locator("body > header, body > main > section, body > footer")
    .evaluateAll((els) => els.map((el) => el.getAttribute("aria-labelledby") ?? el.tagName));
  expect(order).toEqual(["HEADER", "hero-heading", "statement-heading", "grid-heading", "FOOTER"]);
});

test("the page is server-rendered and readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  expect(await outline(page)).toEqual(expectedOutline);
  await expect(page.getByText(copy.grid.disclosure)).toBeVisible();
  await context.close();
});

test("in-page anchors point at the approved destinations", async ({ page }) => {
  await page.goto("/");
  const banner = page.getByRole("banner");
  const footer = page.getByRole("contentinfo");
  const main = page.getByRole("main");

  const links = [
    [banner.getByRole("link", { name: "O coco", exact: true }), "#o-coco"],
    [banner.getByRole("link", { name: "Sabores", exact: true }), "#sabores"],
    [banner.getByRole("link", { name: "Ver sabores", exact: true }), "#sabores"],
    [main.getByRole("link", { name: "Escolha seu coco", exact: true }).first(), "#sabores"],
    [main.getByRole("link", { name: "Escolha seu coco", exact: true }).last(), "#sabores"],
    [footer.getByRole("link", { name: "O coco", exact: true }), "#o-coco"],
    [footer.getByRole("link", { name: "Sabores", exact: true }), "#sabores"],
    [footer.getByRole("link", { name: "Voltar ao topo", exact: true }), "#topo"],
  ] as const;

  for (const [link, href] of links) {
    await expect(link).toHaveAttribute("href", href);
    await expect(page.locator(href)).toHaveCount(1);
  }
});
