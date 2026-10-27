# Where do the coconut and can 3D models come from?

Research for [#3](https://github.com/danielluis07/solo-coco/issues/3), part of map [#1](https://github.com/danielluis07/solo-coco/issues/1). Researched 2026-10-27. Prices and licence terms change, so re-check them before buying anything.

## Recommendation (TL;DR)

Use a hybrid route:

- **Can: model it in Blender.** A 330ml slim can is a lathe (a revolved profile) plus a pull-tab. Give the body one clean rectangular UV strip and a separate label material. Each Flavour is then one 2:1 label image swapped at runtime in three.js. No AI tool or stock library gives you this control over the label UVs, and the work is about half a day.
- **Coconut: generate the whole husked coconut with a paid AI tier, or start from a CC0/Standard-licence library model, then build the halves in Blender.** Cut the whole shell in two with a boolean, add a thin white flesh shell inside each half, and export the two halves as separate nodes so they can rotate open and closed. Neither AI generators nor libraries reliably give a matched whole/halves pair with the same exterior, and the transformation needs that match.
- **Pipeline:** one GLB per object, optimised with `gltf-transform` (Meshopt or Draco geometry, KTX2 textures). Aim for roughly 5–20k triangles per object and 1–2k textures.

Do **not** use free-tier AI output (on Meshy, free-tier output belongs to Meshy and is CC BY with required credit). Do **not** use anything marked Editorial on TurboSquid, CGTrader or Sketchfab: Editorial bans commercial and promotional use, and that includes a brand landing page, even for a fictional brand.

## What we need

| Asset | Requirement |
|---|---|
| Whole coconut | Brown husked (fibrous) coconut, hero quality, rotates in the hero |
| Cracked coconut | The *same* coconut in two halves, white flesh inside, animated open/closed |
| Can | Slim 330ml can (about 58 mm diameter × 146 mm tall in real life; check against a reference), label swapped per Flavour |
| Transformation | Coconut → can is the must-have moment, so the shapes need to stay compatible (similar scale and pivot) |

## Route 1: AI 3D generation (GLB output)

| Tool | Licence/ownership of output | Price (at time of research) | Mesh controls |
|---|---|---|---|
| **Meshy** | Free plan: "Meshy owns all right, title, and interest" in output, released to you under **CC BY 4.0** with credit to Meshy required. Paid plans: "customers on a paid Meshy plan own their Customer Output". Public community posts become **CC0**. Free-plan inputs may be used for training; you can opt out by emailing support. ([Terms §2.9, §3.2, §3.3](https://www.meshy.ai/terms-of-use)) | Free 100 credits/mo (Meshy 6 Lite downloads only); Starter about R$54/mo; Pro about R$107.90/mo. Remesh is **not** on Free. ([pricing](https://www.meshy.ai/pricing)) | API: `topology` `quad`/`triangle`, `target_polycount` 100–300,000 (default 30k), `texture_resolution` 2k/4k/8k, `enable_pbr`, `target_formats` includes `glb`. ([API docs](https://docs.meshy.ai/en/api/image-to-3d)) |
| **Tripo** | Tripo's help pages say paid users have full commercial rights and that Tripo keeps rights in free-user outputs (ToS §5.2.1). Tripo's own pages contradict each other on the free tier, and its ToS and pricing pages returned 403 to our fetch, so this is unverified. ([help: commercial use](https://www.tripo3d.ai/help/privacy-policy/can-i-use-models-commercially)) | Paid tiers (Professional and up) for commercial use; prices not verified | Has a **mesh segmentation** endpoint (`/v3/mesh/segment`, v2 beta adds semantic part labels) that splits an existing mesh into parts. ([docs](https://developers.tripo3d.com/en/docs/mesh-segment)) |
| **Hyper3D Rodin** | The pricing page shows "Unlimited export and any use" on Creator and up, and **not** on Free. The ToS was not reachable (404), so ownership wording is unverified. ([pricing](https://hyper3d.ai/pricing)) | Free (pay $1.5 per result to download); Creator $30/mo (about 60 models); Business $120/mo | Creator adds Smart Low-Poly, baked normals and more polycount options; Business adds high-poly quads. ([pricing](https://hyper3d.ai/pricing)) |
| **Higgsfield 3D** | "You own your outputs"; the Terms "do not tie commercial use rights to a specific plan". Paid plans remove watermarks. ([help center](https://higgsfield.ai/creator-hub/help-center/account/who-owns-my-generations-and-can-i-use-them-commercially)) Its 3D generation routes to third-party models (for example Meshy) ([Blender add-on](https://higgsfield.ai/plugins/blender)), so check that the underlying model's terms do not also apply. | Credit-based | Depends on the model it routes to |

**Fit for our assets:**

- *Whole coconut:* a good fit. A rough, fibrous, organic object hides AI topology problems, and the texture does most of the work. Generate it from a reference image, remesh to about 10–20k triangles, and get a 2k PBR texture.
- *Halves with flesh:* a poor fit. A generator produces one closed outer surface with no interior. Segmentation (Tripo) splits a mesh into the parts it finds and cannot invent a cut plane, an inner shell or white flesh. Generating "a coconut cut in half" separately gives a half whose husk will not match the whole one, so the snap from whole to halves would show. Build the halves in Blender from the whole mesh.
- *Can:* a poor fit. AI UVs are auto-unwrapped atlases. A swappable label needs one predictable rectangular UV region, and an AI tool will not produce one. Redoing the UVs takes longer than modelling the can.

## Route 2: Model libraries

| Library | Licence terms relevant to a brand landing page |
|---|---|
| **Poly Haven** | Everything is **CC0**: "use our assets for any purpose", including commercial, with no credit required. ([licence](https://polyhaven.com/license)) The model catalogue is small, so a coconut may not exist, but its HDRIs are useful for lighting. |
| **Sketchfab** | Free downloads carry Creative Commons licences: CC BY (credit required), BY-NC (**no commercial use**), BY-ND (no modifications, so you cannot cut it into halves), BY-SA, and CC0. ([CC intro](https://sketchfab.com/blogs/community/an-introduction-to-creative-commons-licenses), [crediting](https://help.sketchfab.com/en/articles/16152215-crediting-users-for-3d-model-downloads)) The Standard licence allows commercial use but forbids redistributing the file standalone and requires you to "post terms… that prohibit standalone reuse" on the website. The Editorial licence prohibits "advertising, promotion, endorsements, and merchandising". ([licences](https://sketchfab.com/licenses)) The Sketchfab Store has **closed**, so only free downloads remain. ([store FAQ](https://help.sketchfab.com/en/articles/16152225-store-license-usage-faq)) |
| **Fab (Epic)** | Licences are CC-BY or Standard. Standard has a Personal tier (buyer earning ≤ US$100k gross commercial revenue in the last 12 months) and a Professional tier. ([Epic docs](https://dev.epicgames.com/documentation/en-us/fab/licenses-and-pricing-in-fab)) Fab's summary says Standard allows commercial use and modification but no standalone redistribution. The binding text is the [Fab EULA](https://www.fab.com/eula), which returned 403 to our fetch. |
| **CGTrader** | Royalty Free: commercial use is fine, but the file cannot be passed on "in the form it is downloaded". Editorial: non-commercial only (education, personal, journalism). ([RF vs Editorial](https://help.cgtrader.com/hc/en-us/articles/360015193418-What-is-the-difference-between-Royalty-Free-and-Editorial-licenses), [Editorial](https://help.cgtrader.com/hc/en-us/articles/360015193398-Editorial-License)) |
| **TurboSquid** | Royalty-free unless noted otherwise. Editorial-labelled models are limited to newsworthy or academic use, cannot be used for promotion or advertising, and cannot be upgraded. Models showing real brands are editorial-only. ([licence](https://www.turbosquid.com/licensing), [RF FAQ](https://www.turbosquid.com/help/en/articles/9937423-royalty-free-license-faq)) |

**Notes:**

- A website serves the GLB to the browser, so anyone can download it from the network tab. Standard and Royalty-Free licences forbid *standalone redistribution*. Embedding the model in a site is the normal licensed use, but Sketchfab Standard explicitly asks for site terms that forbid extraction. Add a line to the footer or terms page if we use a licensed model. This is not legal advice; a CC0 or self-made asset avoids the question entirely.
- Stock drink cans are usually **branded (and therefore Editorial)** or come with UVs we would rework anyway. Stock coconuts are common and often come in "whole + half" packs, but the pairs rarely share exact exterior geometry.
- **Avoid:** anything marked Editorial, NC (NonCommercial) or ND (NoDerivatives). With CC-BY, credit has to appear somewhere (the footer works).

## Route 3: Model in Blender

- **Can:** draw a half-profile curve (dome, body, neck taper, rim) and revolve it with the Screw modifier (Blender's lathe tool), or spin a profile edge loop. Add a simple modelled tab. Split materials into `Body_Label` (the straight cylinder section) and `Metal` (top, bottom, neck, tab, using metallic/roughness only). Unwrap the label section with a single seam at the back, as one rectangle filling 0–1 UV space. A 330ml slim can is about 58 × 146 mm, so the label strip ratio is about π·58 : label height (about 182 : 115, roughly 1.6:1). Effort: **2–4 hours** for someone comfortable in Blender, about a day for a beginner. Size: about 2–6k triangles with a smooth-shaded body. Cost: free.
- **Coconut from scratch:** sculpting convincing husk fibres is many hours of skilled work, with texture painting on top. Not worth it when AI or libraries cover the whole coconut.
- **Halves (from any whole coconut):** duplicate the whole mesh, boolean-cut it with a jagged plane (a displaced or knife-cut crack edge looks better than a flat cut), then solidify inward or model an inner surface: a thin brown shell layer plus a white flesh layer with a slightly rough, satin material. Set each half's origin on the hinge or crack line so it can rotate open in three.js, or keyframe a short "open" animation clip in Blender and export it. Effort: **2–4 hours**.

## Route 4: Hybrid (recommended)

1. **Coconut:** on a *paid* Meshy, Rodin or Tripo month (one month of Meshy Pro or Rodin Creator costs about US$20–30), generate the whole coconut from a good reference image. Remesh to about 15k triangles with a 2k PBR texture. Alternatively, use a CC0 or Standard-licence library coconut.
2. Build the two halves from that same mesh in Blender, as in Route 3, so the exterior matches the whole coconut exactly. Export **one GLB** with three nodes (`coconut_whole`, `coconut_half_a`, `coconut_half_b`), or export whole and halves only, with the halves swapped in at the "crack" beat.
3. **Can:** model in Blender with the label UV strip. Export `can.glb` with a default label.
4. Keep the coconut and can at a similar world scale and on a shared pivot, so the coconut→can transformation (a crossfade, dissolve or morph, to be decided in the stack ADR) lines up.

**Total effort:** about 1–1.5 days. **Cost:** about US$0–30.

## Per-Flavour label art (three.js)

- Label art for each Flavour is a flat image the size of the UV rectangle (for example 2048 × 1280, or 2048 × 1024 for a power-of-two size, with the art laid out at the true ≈1.6:1 aspect inside it). Designers work against a template exported from the UV layout in Blender (UV → Export UV Layout).
- At runtime, load the shared `can.glb` once, then swap only `material.map` on the `Body_Label` mesh:
  - Textures that GLTFLoader loads get `texture.flipY = false`, and base colour textures get `SRGBColorSpace` ([GLTFLoader source](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js)). A label loaded separately with `TextureLoader` must therefore be set to `flipY = false` and `colorSpace = THREE.SRGBColorSpace`, or it will render upside down or washed out.
  - Set `material.needsUpdate` only if the material had no map before. Swapping one texture for another needs no recompile.
  - Preload every Flavour label (they are small) so hover swaps on the Flavour grid are instant. Dispose of textures that are no longer used.
- Alternative: one texture atlas holding all Flavours with `KHR_texture_transform` offsets (GLTFLoader supports the extension). This is a single download, but harder to manage. Separate textures are simpler for a few Flavours.
- Keep metal parts on a separate material so a label swap never touches them. A clear-coat or metallic finish on the label section can stay constant across Flavours.

## Web budgets and compression

Rule-of-thumb budgets (engineering judgement for a landing-page hero, not a spec):

| Asset | Triangles | Textures | Target GLB (compressed) |
|---|---|---|---|
| Coconut whole + halves | 10–25k total | 1× 2k base colour + 1–2k normal/ORM (shared by the halves; add a 1k flesh texture or a flat material) | ≈0.5–1.5 MB |
| Can | 2–6k | Label 2k (per Flavour, about 100–300 KB as KTX2/WebP); metal can be untextured | ≈0.2–0.5 MB plus labels |

**gltf-transform** ([CLI docs](https://gltf-transform.dev/cli)):

- `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress ktx2` (or `--compress draco`). `optimize` runs the full pipeline (dedup, weld, simplify, resize, and so on). The docs warn that its defaults "may not be ideal for all scenes", so check `optimize -h`.
- Individual steps: `weld`, `simplify`, `resize`, `draco`, `meshopt`, `etc1s` / `uastc` (KTX2 + Basis).
- **Meshopt vs Draco:** both need a decoder in three.js (`setMeshoptDecoder`, `setDRACOLoader`) ([GLTFLoader docs](https://threejs.org/docs/pages/GLTFLoader.html)). Meshopt also compresses animation, which suits the coconut opening if it is a baked clip, and its decoder is small. Draco usually gives smaller static geometry.
- **KTX2 (`KHR_texture_basisu`):** smaller downloads *and* lower GPU memory, transcoded at runtime to the GPU's native format. Dimensions **must be multiples of 4**, and power of two is recommended ([spec](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md)). Use UASTC for normal maps and the label (sharp text), and ETC1S for the coconut base colour. Needs `KTX2Loader` (`setKTX2Loader`).

## Effort and cost summary

| Route | Coconut whole | Coconut halves | Can + labels | Cost | Risk |
|---|---|---|---|---|---|
| AI only | ✅ fast (minutes) | ❌ no matching interior | ❌ unusable UVs | US$20–30/mo paid tier (free tier output is CC BY / provider-owned) | Halves mismatch; label rework |
| Library only | ✅ if a CC0/Standard one exists | ⚠️ packs exist, rarely exact matches | ⚠️ often branded/editorial | US$0–50 | Licence traps (Editorial, NC, ND); credit needed for CC-BY |
| Blender only | ❌ hours of sculpting | ✅ | ✅ 2–4 h | US$0 | Time and skill |
| **Hybrid** | ✅ AI or library | ✅ Blender cut | ✅ Blender | **US$0–30, ≈1–1.5 days** | Low |

## Unverified / follow-ups

- The Tripo ToS, Rodin ToS and Fab EULA could not be fetched (403/404). Read the actual terms of whichever AI tool or library is used before downloading.
- Higgsfield 3D routes to third-party models. Confirm the routed model's terms.
- The coconut→can transformation technique (crossfade, dissolve shader or morph) belongs to the 3D/animation stack ADR. A morph would need matching vertex counts, which favours a dissolve or crossfade with these separate meshes.
