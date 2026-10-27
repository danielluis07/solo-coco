# Hybrid 3D asset route

The **can** is modelled in Blender: a lathed profile plus a tab, with one clean rectangular UV strip on a separate `Body_Label` material. Each Flavour is one label image swapped at runtime via `material.map` (`flipY = false`, `SRGBColorSpace`). The **whole coconut** comes from a **CC0 library model first**. If no CC0 model is good enough, we pay for one month of Meshy (~US$20), whose paid plans give us ownership of the output. The **halves** are cut from that same whole mesh in Blender with a jagged boolean, plus a white flesh shell inside, and pivots on the crack line so the halves can open and close. The project owner does the Blender work (~1–1.5 days). We chose this because stock and AI cans come with auto-atlased UVs that block per-Flavour label swaps, and AI generators can't produce a matching interior for the halves. Research: [Where do the coconut and can 3D models come from?](https://github.com/danielluis07/solo-coco/issues/3).

## Pipeline and budgets

Optimise with `gltf-transform optimize --compress meshopt --texture-compress ktx2`. We use Meshopt rather than Draco because it decodes faster. Budgets: coconut 10–25k triangles, can 2–6k, textures 1–2k (KTX2 dimensions must be multiples of 4).

## Flavour can images

The can images on the Flavour cards are **renders of the same can model**, posed and lit the same way and swapping only the label per Flavour, exported as transparent images. They are never AI-generated. This keeps them continuous with the hero can, keeps the label text exact, and avoids extra WebGL canvases.

## Licensing rules

Never use models marked Editorial, NC or ND, or free-tier AI output. AI image generation may be used for label-art ingredients and mood imagery only on a paid tier we own the output of. Those uses are decided in their own tickets.
