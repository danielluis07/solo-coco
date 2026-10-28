# Hybrid 3D asset route

The **can** is modelled in Blender: a lathed profile plus a tab, with one clean rectangular UV strip on a separate `Body_Label` material. Each Flavour is one label image swapped at runtime via `material.map` (`flipY = false`, `SRGBColorSpace`). The **whole coconut** is **procedural**: a committed Blender Python script shapes it (a mature brown coconut, oval and lying on its side) and paints its fibrous husk, so it is our own work. The **halves** are cut from that same whole mesh in Blender along a zigzag crack through the middle, with the brown nut shell and white flesh inside, the coconut water's vessel in the bottom half, and pivots on the crack line so the halves can open and close. All of it is scripted and rebuilds headlessly with one command (`bun run assets:hero`; see `assets/hero/README.md`). We chose this because stock and AI cans come with auto-atlased UVs that block per-Flavour label swaps, and AI generators can't produce a matching interior for the halves. Research: [Where do the coconut and can 3D models come from?](https://github.com/danielluis07/solo-coco/issues/3).

### Amended: no CC0 coconut was good enough

The first route was a CC0 library model, then one month of Meshy (~US$20) if none was good enough. In [Hero 3D tracer bullet](https://github.com/danielluis07/solo-coco/issues/25) no CC0 coconut met the budgets: the only one found was a ~224-triangle PSX model with 128–256 px textures, and Meshy's "CC0" gallery is free-tier AI output, which the licensing rules below forbid. The good scans were CC BY or NC. The project owner chose a procedural coconut over CC BY with attribution and over Meshy.

## Pipeline and budgets

Optimise with `gltf-transform optimize --compress meshopt --texture-compress ktx2`. We use Meshopt rather than Draco because it decodes faster. Budgets: coconut 10–25k triangles, can 2–6k, textures 1–2k (KTX2 dimensions must be multiples of 4).

### Amended: a realistic husk over the budget

The 10–25k, 1–2k coconut read as smooth brushed wood beside the owner's reference photo of a real husk. The project owner accepted going over budget for a realistic surface. The coconut is now 50–90k triangles whole and 50–120k for the two halves, so the husk's grooves are real geometry. Its colour map is 4096 × 2048 and its normal map 2048 × 1024. The can and label keep the original budgets. This likely takes the deferred Hero transfer past DESIGN.md's 4 MiB target; that trade-off is accepted.

The coconut water is no longer modelled. The bottom half carries only its vessel, `Liquid`, and the live scene draws the water in it with a slosh simulation (`lib/slosh.ts`, `lib/hero-liquid.ts`).

## Flavour can images

The can images on the Flavour cards are **renders of the same can model**, posed and lit the same way and swapping only the label per Flavour, exported as transparent images. They are never AI-generated. This keeps them continuous with the hero can, keeps the label text exact, and avoids extra WebGL canvases.

## Licensing rules

Never use models marked Editorial, NC or ND, or free-tier AI output. AI image generation may be used for label-art ingredients and mood imagery only on a paid tier we own the output of. Those uses are decided in their own tickets.
