import { expect, test } from "@playwright/test";

const title = "SoloCoco — Só o coco.";
const description =
  "Bebida de coco levemente gaseificada, com seis sabores e jeito de barraca. SoloCoco é uma marca fictícia. Nenhuma compra é realizada.";

test("search and social previews use the approved identity", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(title);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  const tags = {
    description,
    "og:title": title,
    "og:description": description,
    "og:locale": "pt_BR",
    "og:site_name": "SoloCoco",
    "og:type": "website",
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
  };
  for (const [name, content] of Object.entries(tags)) {
    await expect(page.locator(`head meta[${name.startsWith("og:") ? "property" : "name"}="${name}"]`))
      .toHaveAttribute("content", content);
  }
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

test("sharing image has the approved dimensions and exact alternative text", async ({ page, request }) => {
  await page.goto("/");
  const alt = "SoloCoco — Só o coco. Lata do sabor Só o Coco sobre fundo claro, com sombra marrom. Marca fictícia.";
  for (const selector of ['property="og:image:alt"', 'name="twitter:image:alt"']) {
    await expect(page.locator(`head meta[${selector}]`)).toHaveAttribute("content", alt);
  }
  await expect(page.locator('head meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
  await expect(page.locator('head meta[property="og:image:height"]')).toHaveAttribute("content", "630");
  const response = await request.get("/sharing-image.png");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/png");
  const dimensions = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/sharing-image.png";
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  });
  expect(dimensions).toEqual([1200, 630]);
});

test("browser and home-screen icons are served at their advertised sizes", async ({ page, request }) => {
  await page.goto("/");
  for (const [rel, size] of [["icon", 32], ["apple-touch-icon", 180]] as const) {
    const link = page.locator(`head link[rel="${rel}"][type="image/png"][sizes="${size}x${size}"]`);
    await expect(link).toHaveCount(1);
    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    const response = await request.get(href!);
    expect(response.ok()).toBe(true);
    const dimensions = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, href!);
    expect(dimensions).toEqual([size, size]);
  }
  const favicon = await request.get("/favicon.ico");
  expect(favicon.ok()).toBe(true);
  // ICO signature, rather than accepting an HTML fallback at this URL.
  expect([...(await favicon.body()).subarray(0, 4)]).toEqual([0, 0, 1, 0]);
});

test("indexing follows the deployment environment", async ({ page }) => {
  await page.goto("/");
  const expected = process.env.METADATA_EXPECT_INDEX === "true" ? "index, follow" : "noindex, follow";
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", expected);
});

test("only a configured production URL supplies canonical and absolute social URLs", async ({ page }) => {
  await page.goto("/");
  // Expectations are supplied independently by test:metadata, not derived from app env logic.
  const origin = process.env.METADATA_EXPECT_ORIGIN;
  const canonical = page.locator('head link[rel="canonical"]');
  const ogUrl = page.locator('head meta[property="og:url"]');
  if (origin) {
    await expect(canonical).toHaveAttribute("href", origin);
    await expect(ogUrl).toHaveAttribute("content", origin);
  } else {
    await expect(canonical).toHaveCount(0);
    await expect(ogUrl).toHaveCount(0);
  }
  for (const selector of ['property="og:image"', 'name="twitter:image"']) {
    await expect(page.locator(`head meta[${selector}]`))
      .toHaveAttribute("content", `${origin ?? ""}/sharing-image.png`);
  }
});
