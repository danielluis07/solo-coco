// The plain values the Hero's timeline and entrance write and the 3D scene reads
// every frame (ADR 0001: the timeline writes refs, R3F reads them, React never re-renders).

import stage from "@/assets/hero/stage.json";

/** The first frame: the pose the poster is rendered in. */
export function createHeroRig() {
  return {
    /** The coconut's pose; the cap and body share it. */
    coconut: { y: 0, scale: stage.coconut.scale, rotX: 0, rotY: stage.coconut.rotY },
    /** The machete cap: 0 closed on the body, 1 lifted out of frame. */
    cap: { lift: 0 },
    /** 0 still to 1 shaking hard, before the swap. */
    shake: 0,
    /** Hidden until Virar lata, wound back one turn for its counter-spin to the front. */
    can: { scale: 0, rotY: -Math.PI * 2 },
    /**
     * Offsets the entrance plays out to zero. Kept apart from the scrubbed pose so
     * scrolling during the entrance never captures a half-risen coconut.
     */
    entrance: { y: 0, scale: 1, rotZ: 0 },
  };
}

export type HeroRig = ReturnType<typeof createHeroRig>;
