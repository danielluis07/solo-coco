// Measures the Hero's frame rate for the Motion-tier policy.
// Rules live in DESIGN.md § Performance, loading and runtime fallbacks (Rendering tiers).

import { fpsWindowMs } from "./motion-tier";

export type FpsSampler = {
  /**
   * One animation-loop tick. `active` is true only while the Hero is visible,
   * the tab is active and the animation is moving; other ticks never count.
   */
  tick: (now: number, active: boolean) => void;
};

export function createFpsSampler({
  windowMs = fpsWindowMs,
  warmUpMs,
  onWindow,
}: {
  windowMs?: number;
  /** Active time ignored at the start, while shaders compile and textures upload. */
  warmUpMs: number;
  onWindow: (fps: number) => void;
}): FpsSampler {
  let last: number | null = null;
  let warmUp = warmUpMs;
  let elapsed = 0;
  let frames = 0;

  return {
    tick(now, active) {
      if (!active) {
        last = null;
        return;
      }
      if (last === null) {
        last = now;
        return;
      }
      const delta = now - last;
      last = now;
      if (warmUp > 0) {
        warmUp -= delta;
        return;
      }
      elapsed += delta;
      frames += 1;
      if (elapsed >= windowMs) {
        onWindow((frames * 1000) / elapsed);
        elapsed = 0;
        frames = 0;
      }
    },
  };
}
