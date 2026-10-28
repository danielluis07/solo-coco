// Lab evidence only. Run against `bun run build && bun run start` (PORT=3100).
// Physical A54 profiling and field INP remain separate checks (assets/brand/PROFILE.md).
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.75 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 150, downloadThroughput: 4_000_000 / 8, uploadThroughput: 1_000_000 / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    const evidence = { cls: 0, interactionMaxMs: 0 };
    Object.assign(window, { assetProfile: evidence });
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) evidence.cls += shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) evidence.interactionMaxMs = Math.max(evidence.interactionMaxMs, entry.duration);
    }).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
  });
  await page.goto(process.env.PROFILE_URL ?? "http://localhost:3100", { waitUntil: "domcontentloaded" });
  await page.locator("#hero-heading").waitFor();
  const readyMs = await page.evaluate(async () => {
    await document.fonts.ready;
    const poster = document.querySelector<HTMLImageElement>('img[src*="poster"]');
    if (poster) await poster.decode();
    return performance.now();
  });
  await page.waitForTimeout(20_000);
  const beforeGrid = await page.evaluate(() => performance.getEntriesByType("resource").map(entry => {
    const resource = entry as PerformanceResourceTiming;
    return { path: new URL(resource.name).pathname, transfer: resource.transferSize, encoded: resource.encodedBodySize, startMs: Math.round(resource.startTime) };
  }));
  await page.locator("#sabores").scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "Voltar ao topo", exact: true }).click();
  await page.waitForTimeout(1000);
  const metrics = await page.evaluate(() => ({
    ...(window as unknown as { assetProfile: object }).assetProfile,
    navigation: performance.getEntriesByType("navigation").map(entry => {
      const resource = entry as PerformanceNavigationTiming;
      return { transfer: resource.transferSize, encoded: resource.encodedBodySize };
    }),
    paints: performance.getEntriesByType("paint").map(p => ({ name: p.name, ms: Math.round(p.startTime) })),
  }));
  console.log(JSON.stringify({
    environment: "Desktop Chromium, 393x852, CPU x4, 4 Mbps / 150 ms; emulation is not an A54",
    posterAndFontsReadyUpperBoundMs: Math.round(readyMs),
    beforeGrid,
    ...metrics,
    note: "interactionMaxMs is a lab event duration, not field INP. Transfer sizes include local HTTP headers. Inspect the resource table to separate initial and deferred requests.",
  }, null, 2));
} finally { await browser.close(); }
