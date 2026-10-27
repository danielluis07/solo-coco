// Rebuild for each environment: the page and its metadata are prerendered.
const origin = "https://solococo.example"; // Reserved test domain, never an app default.
const scenarios = [
  { name: "production with URL", vercel: "production", deployment: "", url: origin, index: true },
  { name: "unconfigured deployment", vercel: "", deployment: "", url: "", index: false },
  { name: "preview without URL", vercel: "preview", deployment: "", url: "", index: false },
  { name: "self-hosted production without URL", vercel: "", deployment: "production", url: "", index: true },
  { name: "preview with URL overrides self-hosted production", vercel: "preview", deployment: "production", url: origin, index: false },
];

for (const scenario of scenarios) {
  console.log(`\nMetadata: ${scenario.name}`);
  const child = Bun.spawn([process.execPath, "run", "test:e2e", "tests/e2e/metadata.spec.ts"], {
    env: {
      ...process.env,
      VERCEL_ENV: scenario.vercel,
      DEPLOYMENT_ENV: scenario.deployment,
      PRODUCTION_URL: scenario.url,
      METADATA_EXPECT_INDEX: String(scenario.index),
      METADATA_EXPECT_ORIGIN: scenario.url,
      METADATA_TEST_MATRIX: "1",
    },
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await child.exited;
  if (code !== 0) process.exit(code);
}

export {};
