# Real-time WebGL hero with R3F, GSAP ScrollTrigger and Lenis

The hero's scroll choreography (coconut rotates, cracks open, badges appear, closes, transforms into a can that rotates) is rendered live with **three + @react-three/fiber v9 + @react-three/drei** on the classic `WebGLRenderer`. Scroll drives it through **GSAP ScrollTrigger**: one pinned hero section and one scrubbed master timeline. **Lenis** smooths scrolling across the whole site, with its ticker synced to GSAP. The timeline writes to plain refs and shader uniforms that R3F reads in `useFrame`, so scrolling never causes React re-renders. The scene is a client-only component loaded with `next/dynamic(..., { ssr: false })` from a Client Component, over a static poster. We chose this because a single live scene can run the whole choreography in both scroll directions and stay interactive. It costs about 290 KB gzip of JS plus a few MB of GLBs, much less than an image sequence. Research: [How should scroll-driven 3D be rendered in Next 16?](https://github.com/danielluis07/solo-coco/issues/2).

## Coconut→can transformation

The target is a **noise-dissolve crossfade** between the coconut and can meshes. A shared `uDissolve` uniform is patched into `MeshStandardMaterial` via `onBeforeCompile`, giving each mesh a complementary `discard` and a glowing edge band. The swap is hidden behind an instanced particle burst (fibres, droplets) and a fast Y-spin, all scrubbed by the same timeline value. A **scale-swap behind the particles** is the first version and the permanent low-end tier, and the dissolve is added on top of it.

## Animation scope

GSAP is the only JS animation library. It handles every scroll-linked moment, including the rotating highlighted word. Tailwind/CSS transitions handle hover and UI state (Flavour card hover, Quick-add). Runtime tiers, budgets, loading and failure behavior are specified in `DESIGN.md` under Performance, loading and runtime fallbacks: Full, Lite (scale-swap), and Static (poster with normal page flow). No image-sequence fallback is used. The Accessibility section in `DESIGN.md` requires Static for reduced motion or the visitor's “Desativar animações” choice, disabling pinning, Lenis and decorative movement across the page.

## Considered Options

- **Pre-rendered image sequence as the main renderer**: 6–12 MB+, heavy on iOS memory, not interactive. Subsequently ruled out as a fallback in [What are the performance budgets, loading strategy, and failure fallbacks?](https://github.com/danielluis07/solo-coco/issues/14); Static uses a poster instead.
- **Spline**: about 280 KB runtime, its states play as timed transitions rather than scroll scrubbing, and it gives no shader control for the transformation.
- **drei `ScrollControls`**: its own scroll container fights the normal page sections below the hero.
- **Motion (`useScroll`)**: weaker pin and scrub control for one long choreographed timeline, and it would be a second animation library.
- **WebGPU + TSL**: cleaner shader code, but reaches fewer devices (older iOS) and adds fallback risk. Revisit only if `onBeforeCompile` becomes painful.
- **Morph targets** for coconut→can: need a shared vertex buffer, and the in-between shapes look bad. **Camera cut**: reads as a cut, not a transformation.

## Consequences

- `@react-three/fiber@9` supports React `>=19 <19.4`. Don't bump React past 19.3 until R3F supports it.
