# How should scroll-driven 3D be rendered in Next 16?

Research for [#2](https://github.com/danielluis07/solo-coco/issues/2) (map: [#1](https://github.com/danielluis07/solo-coco/issues/1)).
Researched 2026-10-27 against Next 16.4.3, React 19.3.0, Bun 1.4.4, Tailwind v4 (from `package.json`).

## Answer

**Use real-time WebGL: React Three Fiber v9 + drei + three.js, with GSAP ScrollTrigger as the scroll timeline and Lenis for smooth scroll.** Load the whole 3D scene as a single Client Component through `next/dynamic` with `ssr: false`, and show a static poster image underneath until it's ready. Build the coconut→can moment as a **noise-dissolve crossfade between two separate meshes, hidden behind a burst of particles (fibres and droplets) and a fast spin**. Don't use morph targets. Keep a **pre-rendered image sequence** in reserve as the fallback for low-end devices or reduced motion, and **don't use Spline** for the hero.

Why:

- It's the only option where one scene covers the whole choreography: rotate → crack into halves → stat badges → close → transform into can → can rotates → Flavour-grid hover rotation. Each beat is a value on a scrubbed timeline, and it can run backwards.
- The versions line up exactly with this repo. `@react-three/fiber@9.8.2` declares peer `react >=19 <19.4`, which covers React 19.3.0 (npm registry). GSAP and Lenis have no React peer constraints that matter here.
- The JS cost is moderate and known: about 290 KB gzip in total (see the table). Assets come to 1–3 MB of compressed GLB/KTX2. A 2–3 s image sequence at mobile resolution easily takes 5–15 MB.

## Constraints from Next 16 (local docs)

From `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`:

- `next/dynamic(() => import(...), { ssr: false })` disables prerendering for a Client Component. This is the right switch for a WebGL canvas that needs `window`/WebGL.
- "`ssr: false` is not allowed with `next/dynamic` in Server Components. Please move it into a Client Component." So `app/page.tsx` (a Server Component) renders a small `'use client'` wrapper, and that wrapper does the `dynamic(..., { ssr: false })` import of `<HeroScene/>`.
- `transpilePackages` (`03-api-reference/05-config/01-next-config-js/transpilePackages.md`) compiles a dependency that ships untranspiled code. R3F's install docs recommend `transpilePackages: ['three']` for Next ≥13.1 ([R3F installation](https://r3f.docs.pmnd.rs/getting-started/installation)). Add it only if a three addon actually fails to build under Turbopack.

GSAP's React guide says `useGSAP()` is "safe to use in Next or other server-side rendering environments, provided it is used in client-side components", and it needs `"use client"` at the top of the file. It cleans up automatically through `gsap.context()`, which matters because Strict Mode runs effects twice ([gsap.com/resources/React](https://gsap.com/resources/React/)).

## Comparison

| | R3F + drei + GSAP/Lenis (real-time) | Image-sequence canvas scrub | Spline |
|---|---|---|---|
| **JS weight (min+gzip)** | three 185 KB + R3F 58 KB + GSAP core 27 KB + ScrollTrigger 18 KB + Lenis 5 KB ≈ **~290 KB**; tree-shaken drei helpers on top (see note) | ~0 KB library; you write a ~100-line canvas scrubber (GSAP optional) | `@splinetool/runtime` **~280 KB** gzip main entry, plus the scene file |
| **Asset weight** | 2 GLBs (coconut halves + can) with Draco/Meshopt + KTX2/WebP textures: **~1–3 MB** total | N frames × resolution × variants. E.g. 150 frames × ~40–80 KB WebP/AVIF ≈ **6–12 MB**, often doubled for mobile/desktop art direction | `.splinecode` scene; size depends on the scene, and the editor controls what you get |
| **Mobile performance** | Good if you budget for it: `dpr={[1, 1.5]}`, `PerformanceMonitor` to degrade, `frameloop="demand"` outside the hero, few draw calls ([R3F scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)). The GPU cost stays the same however long you scroll | Cheapest per frame (a single `drawImage`), but memory-heavy: decoded bitmaps (w×h×4 bytes each) can blow past iOS memory limits, so you need windowed decoding. Network is the bottleneck | Least control over the renderer. You can't tune DPR or draw calls beyond what the editor exposes. WebGPU by default with WebGL fallback ([Spline export docs](https://docs.spline.design/exporting-your-scene/web/exporting-as-code)) |
| **Next 16 / React 19** | R3F 9.x peer `react >=19 <19.4`. drei 10.x peer `react ^19`, `@react-three/fiber ^9`. Client-only via `dynamic(..., {ssr:false})` | No compatibility issue. Plain `<canvas>` in a Client Component | `@splinetool/react-spline@4.1.0` peer `next >=14.2`, `react *`. Has a `/next` entry that SSRs a blurred placeholder ([react-spline README](https://github.com/splinetool/react-spline)) |
| **Bun** | Pure JS packages with no postinstall/native builds, so they work with `bun add`. The project already runs Next under `bun --bun` ([Bun Next guide](https://bun.com/guides/ecosystem/nextjs)) | n/a. Frame extraction is an offline step (Blender/ffmpeg) | Pure JS, no issue |
| **Reversible scrub** | Yes: the timeline is a pure function of progress | Yes: frame index = progress × N | Partial: you can drive object properties from code or `emitEvent`/`emitEventReverse`, but editor states play as timed transitions, not a scrubbed progress |
| **Interactivity (Flavour hover, badges)** | Native: pointer events on meshes, and HTML badges via drei `<Html>` or DOM overlays | None: it's video. Hover rotation would need a second sequence per can | Good for hover in-editor, weaker for scroll |
| **Coconut→can** | Yes, fully art-directable (see below) | Yes, trivially: whatever you render offline | Possible, but only with editor-side state transitions; hard to time exactly against scroll |
| **Authoring** | Code + Blender (models). Highest engineering cost | Blender render farm time. Every art change means a re-render and re-export | Lowest engineering cost; design lives in the Spline editor (proprietary, scenes hosted or exported) |

Size sources: min+gzip from bundlephobia for `three@0.186.1`, `@react-three/fiber@9.8.2`, `gsap@3.15.0`, `lenis@1.3.27`, `@splinetool/runtime@2.0.114`. ScrollTrigger measured as `gzip -9` of `gsap@3.15.0/dist/ScrollTrigger.min.js` (17,983 B). Peer ranges from `registry.npmjs.org/<pkg>/latest` on 2026-10-27. The drei weight depends on which helpers you import. Asset-weight figures are estimates, not measurements.

Licensing: GSAP is "now 100% free for all users", and that includes ScrollTrigger, ScrollSmoother, SplitText and MorphSVG ([gsap.com/pricing](https://gsap.com/pricing/)). Lenis is MIT ([repo](https://github.com/darkroomengineering/lenis)).

## Scroll wiring (recommended stack)

- **One pinned hero section, one GSAP timeline, `scrub: 1`.** ScrollTrigger's `scrub: true` ties timeline progress to scroll, and a number adds catch-up smoothing. `pin` makes the section "stick" while a spacer pads the page. Tween durations inside the timeline decide how much scroll distance each beat gets ([ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)). Don't animate the pinned element itself.
- **The timeline tweens plain values, not React state.** For example, tween a `state` object (`rotY`, `split`, `badgeOpacity`, `dissolve`, `canRotY`) and read it inside `useFrame`, or tween three objects' `.rotation`/`.position` and uniforms directly. This keeps React out of the 60 fps loop.
- **Lenis + ScrollTrigger** (from the Lenis README):
  ```js
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  ```
  Leave `syncTouch` off (the default). The README warns it can be unstable on iOS < 16, so mobile keeps native touch scrolling.
- **Alternative: drei `ScrollControls`/`useScroll`.** It has `range()`/`curve()`/`visible()` helpers ([drei docs](https://drei.docs.pmnd.rs/controls/scroll-controls)), but it puts its own scroll container over the canvas. That fights with a normal DOM page that has Tailwind sections after the hero. Prefer ScrollTrigger on the real document scroll.
- **Canvas placement:** one fixed full-viewport `<Canvas>` behind the DOM (or inside the pinned section), with the stat badges and text as normal DOM/Tailwind elements animated by the same timeline. That keeps text selectable and accessible.

## Coconut→can transformation: concrete techniques

A coconut (rough, roughly spherical, fibrous) and a can (smooth cylinder) have different topology. Here are the options, ranked.

### 1. Recommended: noise dissolve crossfade + particle burst + spin

1. Load two separate meshes into the same group: `coconut` (two halves, see the crack beat below) and `can`.
2. Give both materials a shared `uDissolve` uniform (0→1) and a 3D noise function. Patch `MeshStandardMaterial` through `onBeforeCompile` ("useful for the modification of built-in materials", [three Material docs](https://threejs.org/docs/pages/Material.html)). Alternatively, if you opt into `WebGPURenderer`, use a TSL node material. three.js now recommends that path, and R3F supports it through an async `gl` factory ([R3F Canvas](https://r3f.docs.pmnd.rs/api/canvas)).
   - Coconut fragment: `if (noise(p) < uDissolve) discard;` plus an emissive edge band `smoothstep(uDissolve, uDissolve+0.05, noise)` in a pale coconut-milk colour, so the shell looks like it's evaporating.
   - Can fragment: the inverse (`noise(p) > uDissolve` → discard), so it assembles where the coconut disappears.
   - `discard` keeps both meshes opaque, which avoids transparent-sorting issues. `alphaHash` is the documented built-in alternative ([three Material docs](https://threejs.org/docs/pages/Material.html)).
3. Over the same scroll range, scale the coconut slightly down and the can from 0.9→1, and ramp the group's Y-rotation fast (e.g. +540°) so silhouettes blur into each other.
4. Fire an instanced particle burst (one `InstancedMesh` or `Points`: coconut fibres, white droplets) from the dissolve edge, driven by the same `uDissolve` value so it scrubs backwards too. Instancing keeps this to one draw call ([R3F scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)).
5. After that, the can-rotation and text beats are ordinary tweens.

This is cheap (two meshes, one shader chunk, one instanced particle system), fully reversible, and works on WebGL1/2-class mobile GPUs.

### 2. Scale-swap behind particles or a liquid splash (simplest)

Same as #1 without the shader: the coconut scales to 0 inside a dense particle/splash burst, and the can scales up from 0. It looks good at speed and takes the least engineering. Use it as the mobile-tier version of #1, or ship it first and add the dissolve later.

### 3. Camera cut or whip-pan

Hide the swap behind a fast camera move or a full-frame splash plane. It's cinematic, but it reads as a cut rather than a transformation, which is weaker for a "signature moment".

### 4. Not recommended: morph targets

three's morph targets store per-vertex positions in `BufferGeometry.morphAttributes`, so the base and target must share the same vertex buffer (same count and order). The docs also note morph data "cannot be changed" once rendered ([three BufferGeometry docs](https://threejs.org/docs/pages/BufferGeometry.html)). You'd have to author one mesh in Blender that is both a coconut and a can, with matching UVs and topology. That's a lot of modelling work, and the in-between shapes (a lumpy cylinder) usually look worse than a dissolve. The same applies to vertex-shader point morphs between sampled surfaces: they're feasible, but the result looks like particles, not a can.

### Crack-open beat (same scene)

Model the coconut as **two halves plus a flesh cap** (white inner hemisphere) in Blender, exported in one GLB. "Crack" is the halves translating apart on X with slight opposing rotation. Badges are DOM elements positioned at projected 3D anchor points (drei `<Html>` or a manual `vector.project(camera)`). "Close" is the reverse tween. No physics or fracture simulation needed.

## Asset pipeline notes

- Compress GLBs with glTF-Transform: `gltf-transform optimize in.glb out.glb --compress draco --texture-compress webp` ([gltf-transform CLI](https://gltf-transform.dev/cli)). KTX2 (`etc1s`/`uastc`) is a separate command and is better for GPU memory on mobile.
- drei `useGLTF` loads Draco decoders from a CDN by default (you can self-host with `useGLTF.setDecoderPath`), enables Meshopt by default, and supports `useGLTF.preload(url)` ([drei useGLTF](https://drei.docs.pmnd.rs/loaders/gltf-use-gltf)). Self-host the decoders under `public/` to avoid a third-party fetch.
- Flavour grid: reuse **one can GLB** and swap label textures per Flavour, rather than one model per Flavour. Hover rotation is a pointer-driven tween on that card's mesh. Either use one shared canvas with drei `<View>` scissoring, or use static renders/turntable sprites if the grid has many cards on mobile (multiple WebGL contexts are expensive).

## Fallback tier (image sequence, kept in reserve)

For `prefers-reduced-motion`, or when `PerformanceMonitor` reports sustained low fps, swap the live scene for either a short pre-rendered sequence (frames rendered from the same Blender scene, decoded with `createImageBitmap()`, which returns a `Promise<ImageBitmap>` per [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap), and drawn to a 2D canvas based on scroll progress) or simply static key-frame images that crossfade. Both come from the same source models, so this costs render time, not new art. The exact policy belongs in the "performance budget / reduced motion" ticket on the map.

## Why not Spline for the hero

- Scroll-scrubbed, reversible choreography isn't its model. The runtime exposes `setVariable(s)`, `findObjectByName`, `emitEvent`/`emitEventReverse`, and a `scroll` event type ([`@splinetool/runtime` README](https://www.npmjs.com/package/@splinetool/runtime)). But editor states play as timed transitions, so the code would still need GSAP to drive object transforms. At that point you're shipping a ~280 KB runtime to do what three does, with less shader control. A dissolve shader isn't available.
- Spline's export docs say animations/events are only enabled when exporting to Vanilla JS and React (Next isn't named) ([Spline export docs](https://docs.spline.design/exporting-your-scene/web/exporting-as-code)).
- It's still a reasonable tool for **prototyping the motion** or for a non-scroll decorative piece.

## Trade-offs of the recommendation

- **Cost:** it needs real 3D engineering (shaders, a GPU budget) and Blender modelling of the coconut halves and the can. An image sequence moves that cost into rendering and bandwidth instead.
- **Risk:** visual fidelity depends on the real-time lighting and materials (PBR + an HDRI env map) rather than offline path-traced renders. A sequence would look more "photographic".
- **Upside:** small downloads, infinite resolution, reversible, interactive (hover and badges), and one scene can be reused for the Flavour grid. Art changes are code/texture edits, not re-renders.

## Open questions for downstream tickets

- Exact scroll lengths per beat (page-spec ticket).
- Mobile choreography: whether mobile uses technique #2 instead of #1 (performance-budget ticket).
- Modelling source: whether the coconut and can will be modelled in Blender or sourced and retopologised (3D asset plan ticket).
