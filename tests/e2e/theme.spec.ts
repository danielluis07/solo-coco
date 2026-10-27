import { expect, test } from "@playwright/test";
import { copy, flavours, flavourTitle } from "@/content/page";

const ink = { fibra: "rgb(58, 42, 29)", polpa: "rgb(250, 250, 245)" };

function rgb(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

test("cards use the approved text colour on their accent", async ({ page }) => {
  await page.goto("/");
  for (const flavour of flavours) {
    const card = page.getByRole("article", { name: flavourTitle(flavour) });
    await expect(card).toHaveCSS("background-color", rgb(flavour.accent));
    await expect(card).toHaveCSS("color", ink[flavour.ink]);
  }
  // Polpa on Açaí, Fibra on the rest.
  expect(flavours.filter((f) => f.ink === "polpa").map((f) => f.slug)).toEqual(["acai"]);
});

test("Bowlby One sets display text and Figtree sets body text", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-family", /Bowlby One/);
  await expect(page.locator("body")).toHaveCSS("font-family", /Figtree/);
  const html = await page.content();
  expect(html).not.toMatch(/geist/i);
});

test("one fixed palette: a dark colour scheme changes nothing", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("background-color", ink.polpa);
  await expect(page.locator("body")).toHaveCSS("color", ink.fibra);
  await expect(page.getByRole("region", { name: copy.statement.headline, exact: true })).toHaveCSS(
    "background-color",
    ink.fibra,
  );
  await context.close();
});
