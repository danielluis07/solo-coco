// Rebuilds Hero models, six labels and card renders, brand paths, sharing image
// and icons from assets/hero/, assets/brand/ and scripts/build-brand-assets.ts.
// Runs Blender, gltf-transform and KTX, and checks geometry, textures and cards.
//
//   bun run assets:hero
//
// Needs Blender 5.2+ (`BLENDER` env var, `blender` on PATH, or the default
// Windows install) and KTX-Software's `ktx` CLI on PATH.

import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { prepareBrandAssets, finishBrandAssets } from "./build-brand-assets";

const root = resolve(import.meta.dir, "..");
const source = join(root, "assets/hero");
const work = join(root, "assets/hero/.build");
const out = join(root, "public/hero");

/**
 * ADR 0002 triangle budgets, per model as it is drawn: the whole coconut and the
 * two halves are never on screen together, so each state is held to the budget.
 * The coconut's are raised so the husk's grooves are real geometry (ADR 0002, amended).
 */
const budgets = {
  "coconut.glb": [
    { nodes: ["Coconut"], min: 50_000, max: 90_000 },
    { nodes: ["Coconut_Top", "Coconut_Bottom"], min: 50_000, max: 120_000 },
  ],
  "can.glb": [{ nodes: ["Can"], min: 2_000, max: 6_000 }],
};
/** Texture sizes per file; the husk's colour map is 4096 wide so its fibre holds up close. */
const textureSizes = {
  "coconut.glb": { min: 1024, max: 4096 },
  "can.glb": { min: 1024, max: 2048 },
  "label-so-o-coco.ktx2": { min: 1024, max: 2048 },
};

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

function checkTextureSize(file: keyof typeof textureSizes, name: string, w: number, h: number) {
  const size = textureSizes[file];
  if (w % 4 || h % 4 || Math.max(w, h) > size.max || Math.max(w, h) < size.min) {
    throw new Error(`${name} is ${w}×${h}`);
  }
}

async function checkBudgets() {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  for (const [file, models] of Object.entries(budgets)) {
    const document = await io.read(join(out, file));
    // A node and everything under it: optimising can move a parent's mesh onto a child.
    const triangles = (name: string) => {
      const node = document.getRoot().listNodes().find((n) => n.getName() === name);
      if (!node) throw new Error(`${file}: no node ${name}`);
      let count = 0;
      node.traverse((child) => {
        for (const primitive of child.getMesh()?.listPrimitives() ?? []) {
          count += (primitive.getIndices()?.getCount() ?? primitive.getAttribute("POSITION")!.getCount()) / 3;
        }
      });
      return count;
    };
    for (const { nodes, min, max } of models) {
      const count = nodes.reduce((sum, name) => sum + triangles(name), 0);
      if (count < min || count > max) throw new Error(`${file}: ${nodes.join(" + ")} has ${count} triangles, outside ${min}–${max}`);
      console.log(`${file}: ${nodes.join(" + ")} ${count} triangles`);
    }
    for (const texture of document.getRoot().listTextures()) {
      const [w, h] = texture.getSize() ?? [0, 0];
      checkTextureSize(file as keyof typeof budgets, `${file}: texture ${texture.getName()}`, w, h);
    }
    console.log(`${file}: materials ${document.getRoot().listMaterials().map((m) => m.getName()).join(", ")}`);
  }

  // KTX2 header: pixelWidth and pixelHeight follow the identifier, vkFormat and typeSize.
  const label = new DataView((await readFile(join(out, "label-so-o-coco.ktx2"))).buffer);
  checkTextureSize("label-so-o-coco.ktx2", "label-so-o-coco.ktx2", label.getUint32(20, true), label.getUint32(24, true));
}

await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });
await mkdir(out, { recursive: true });

const labelPng = join(work, "label-so-o-coco.png");
await prepareBrandAssets();

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

for (const file of Object.keys(budgets)) {
  // KTX2 first, by slot: ETC1S keeps the husk's colour small, and the normals take UASTC,
  // which ETC1S would block up, with zstd (fibre noise barely compresses, though).
  const textured = join(work, `ktx2-${file}`);
  await run(["bunx", "gltf-transform", "etc1s", join(work, file), textured, "--slots", "baseColorTexture"]);
  await run(["bunx", "gltf-transform", "uastc", textured, textured, "--slots", "normalTexture", "--level", "2", "--zstd", "18"]);
  // The flags after the ticket's command keep the named nodes, materials and UVs the
  // Hero reads (Coconut, Coconut_Top, Coconut_Bottom, Liquid, Can; Body_Label), and keep
  // the halves' crack edges exactly on the whole coconut's surface.
  await run([
    "bunx",
    "gltf-transform",
    "optimize",
    textured,
    join(out, file),
    "--compress",
    "meshopt",
    // Already KTX2, above.
    "--texture-compress",
    "false",
    "--texture-size",
    String(textureSizes[file as keyof typeof budgets].max),
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
await finishBrandAssets();
console.log("Hero assets rebuilt in public/hero/.");
