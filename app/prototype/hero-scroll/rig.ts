// PROTOTYPE: the plain values a variant's timeline writes and the 3D stage reads every frame
// (ADR 0001: the timeline writes refs, R3F reads them in useFrame, React never re-renders).

export function createRig() {
  return {
    coconut: { x: 0, y: 0, scale: 0.75, rotX: 0, rotY: 0.5, rotZ: 0 },
    /** Machete cut across the top: `lift` raises the cap, `slide` swipes it sideways. */
    cap: { lift: 0, slide: 0 },
    /** Split into left and right halves, 0 closed to 1 open. */
    split: 0,
    shake: 0,
    /** Particle burst that hides the coconut→can swap, 0 to 1. */
    burst: 0,
    can: { y: 0, scale: 0, rotX: 0, rotY: 0 },
    /** Orbit camera around the object: radius, azimuth, elevation (radians), look-at height. */
    cam: { r: 6, azim: 0, elev: 0, lookY: 0 },
    /** Visibility of badges anchored in 3D space (variant B). */
    badges: { 0: 0, 1: 0, 2: 0 } as Record<number, number>,
  };
}

export type Rig = ReturnType<typeof createRig>;

/** A named stretch of the timeline, in timeline units. */
export type Beat = { name: string; from: number; to: number };
