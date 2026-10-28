// Rebuilds every Hero 3D asset from the committed sources in assets/hero/:
// rasterises the can label, runs the Blender script (can, coconut, halves,
// poster), optimises the GLBs with gltf-transform, encodes the label as KTX2,
// copies the decoders and checks the ADR 0002 budgets.
//
//   bun run assets:hero
//
// Needs Blender 5.2+ (`BLENDER` env var, `blender` on PATH, or the default
// Windows install) and KTX-Software's `ktx` CLI on PATH.

import { existsSync } from "node:fs";
import { copyFile, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { chromium } from "@playwright/test";

const root = resolve(import.meta.dir, "..");
const source = join(root, "assets/hero");
const work = join(root, "assets/hero/.build");
const out = join(root, "public/hero");

/** ADR 0002: triangles per model, and texture edge lengths. */
const budgets = {
  "coconut.glb": { minTriangles: 10_000, maxTriangles: 25_000 },
  "can.glb": { minTriangles: 2_000, maxTriangles: 6_000 },
};
const textureSize = { min: 1024, max: 2048 };

function findBlender() {
  if (process.env.BLENDER) return process.env.BLENDER;
  const onPath = Bun.which("blender");
  if (onPath) return onPath;
  const windows = "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe";
  if (existsSync(windows)) return windows;
  throw new Error("Blender not found: install Blender 5.2+ or set BLENDER to its executable.");
}

async function run(cmd: string[]) {
  console.log(`$ ${cmd.join(" ")}`);
  const proc = Bun.spawn(cmd, { cwd: root, stdout: "inherit", stderr: "inherit" });
  if ((await proc.exited) !== 0) throw new Error(`${cmd[0]} exited with ${proc.exitCode}`);
}

/** The label SVG in Chromium, so its @font-face fonts and grain filter render exactly. */
async function rasteriseLabel(svg: string, png: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2048, height: 1024 } });
  await page.goto(`file:///${svg.replaceAll("\\", "/")}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 2048, height: 1024 } });
  await browser.close();
}

async function checkBudgets() {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  for (const [file, budget] of Object.entries(budgets)) {
    const document = await io.read(join(out, file));
    let triangles = 0;
    for (const mesh of document.getRoot().listMeshes()) {
      for (const primitive of mesh.listPrimitives()) {
        const count = primitive.getIndices()?.getCount() ?? primitive.getAttribute("POSITION")!.getCount();
        triangles += count / 3;
      }
    }
    for (const texture of document.getRoot().listTextures()) {
      const [w, h] = texture.getSize() ?? [0, 0];
      if (w % 4 || h % 4 || Math.max(w, h) > textureSize.max || Math.max(w, h) < textureSize.min) {
        throw new Error(`${file}: texture ${texture.getName()} is ${w}×${h}`);
      }
    }
    if (triangles < budget.minTriangles || triangles > budget.maxTriangles) {
      throw new Error(`${file}: ${triangles} triangles is outside ${budget.minTriangles}–${budget.maxTriangles}`);
    }
    const nodes = document.getRoot().listNodes().map((n) => n.getName());
    const materials = document.getRoot().listMaterials().map((m) => m.getName());
    console.log(`${file}: ${triangles} triangles; nodes ${nodes.join(", ")}; materials ${materials.join(", ")}`);
  }
}

await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });
await mkdir(out, { recursive: true });

const labelPng = join(work, "label-so-o-coco.png");
await rasteriseLabel(join(source, "label-so-o-coco.svg"), labelPng);

await run([
  findBlender(),
  "--background",
  "--factory-startup",
  "--python-exit-code",
  "1",
  "--python",
  join(source, "build_hero.py"),
  "--",
  work,
  labelPng,
]);

// The flags after the ticket's command keep the named nodes, materials and UVs the
// Hero reads (Coconut, Coconut_Top, Coconut_Bottom, Can; Body_Label), and keep
// the halves' crack edges exactly on the whole coconut's surface.
for (const file of Object.keys(budgets)) {
  await run([
    "bunx",
    "gltf-transform",
    "optimize",
    join(work, file),
    join(out, file),
    "--compress",
    "meshopt",
    "--texture-compress",
    "ktx2",
    "--flatten",
    "false",
    "--join-named",
    "false",
    "--palette",
    "false",
    "--simplify",
    "false",
    "--instance",
    "false",
    // The can's label UVs feed a texture applied only at runtime, so they look unused here.
    "--prune-attributes",
    "false",
  ]);
}

// The label is swapped at runtime per Flavour, so it ships beside the can, not inside it.
// UASTC keeps the lettering crisp; zstd brings the transfer back down.
await run([
  "ktx",
  "create",
  "--format",
  "R8G8B8A8_SRGB",
  "--assign-tf",
  "srgb",
  "--encode",
  "uastc",
  "--uastc-quality",
  "2",
  "--zstd",
  "18",
  "--generate-mipmap",
  labelPng,
  join(out, "label-so-o-coco.ktx2"),
]);

// The poster is served from public/ next to the models.
await copyFile(join(work, "poster.png"), join(out, "poster.png"));

// Self-hosted decoders, version-locked to the installed three.
const basis = join(root, "node_modules/three/examples/jsm/libs/basis");
await mkdir(join(out, "basis"), { recursive: true });
for (const file of ["basis_transcoder.js", "basis_transcoder.wasm"]) {
  await copyFile(join(basis, file), join(out, "basis", file));
}

await checkBudgets();
console.log("Hero assets rebuilt in public/hero/.");
