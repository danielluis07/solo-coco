// The plain values the Hero's timeline and entrance write and the 3D scene reads
// every frame (ADR 0001: the timeline writes refs, R3F reads them, React never re-renders).

import stage from "@/assets/hero/stage.json";

/** A piece of Copy around the object: 0 waiting below its place, 1 in place, 2 gone upwards. */
type Piece = { at: number };
const pieces = (count: number, at: number): Piece[] => Array.from({ length: count }, () => ({ at }));

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
    /** The fibres, husk chips and droplets that hide the swap: 0 not thrown yet to 1 settled away. */
    burst: 0,
    /** The Copy that moves around the object, in reading order within each Beat. */
    copy: {
      /** Girar: the headline, the call to action and the two corner lines, composed from the first frame. */
      intro: pieces(4, 1),
      /** Facão: the two lines of the split headline. */
      opened: pieces(2, 0),
      /** Lata gira: the headline and the corner block. */
      closing: pieces(2, 0),
    },
    /** Selos: each badge's drift, 0 below the frame to 1 above it. */
    badges: [{ drift: 0 }, { drift: 0 }, { drift: 0 }],
    /** Virar lata: the painted meter, shown as a piece of Copy, and its count 0–100. */
    meter: { at: 0, count: 0 },
    /** Saída: the brand statement's Fibra panel rising over the frame, 0 below it to 1 covering it. */
    panel: { rise: 0 },
    /**
     * Offsets the entrance plays out to zero. Kept apart from the scrubbed pose so
     * scrolling during the entrance never captures a half-risen coconut.
     */
    entrance: { y: 0, scale: 1, rotZ: 0 },
  };
}

export type HeroRig = ReturnType<typeof createHeroRig>;
