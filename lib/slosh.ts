// The coconut water's slosh: how its surface leans, heaves and ripples inside the
// bottom half as the coconut moves. Plain numbers in the vessel's own frame (three.js
// axes, y up through the still surface), so it runs and tests without WebGL; the
// scene feeds it the direction of gravity each frame and draws the surface it returns.

export type SloshOptions = {
  /** How often the water rocks from side to side, in Hz. */
  frequency: number;
  /** Damping ratio of the rocking: 0 rocks for ever, 1 settles without overshooting. */
  damping: number;
  /**
   * How much of a tilt the water levels out against, 0–1. Fully level water would turn
   * edge-on to the fixed camera as the coconut tips towards the reader, so it follows
   * gravity only partly and leans back in the shell rather than staying level.
   */
  gravity: number;
  /** The steepest the surface leans in the shell (rise per unit run), so it never spills over the crack. */
  maxTilt: number;
};

export const defaultSloshOptions: SloshOptions = { frequency: 1.3, damping: 0.08, gravity: 0.35, maxTilt: 0.1 };

/** The swell rocks faster than the tilt, as a basin's second mode does. */
const swellRatio = 1.7;
/** How hard rocking feeds the swell and the ripples, and how fast the ripples die away (per second). */
const coupling = { swell: 0.05, ripple: 3, rippleDecay: 1.4 };
/** Below this the water reads as still, and the scene can stop drawing it. */
const stillEnergy = 1e-7;
/** The integration step, in seconds; longer frames are split into steps this long. */
const substep = 1 / 240;
/** A frame longer than this (the tab was hidden, the Hero offscreen) counts as only this long. */
const maxFrame = 0.1;

export type Slosh = {
  /** The surface's slope along x and along z (rise per unit run), in the vessel's frame. */
  readonly tilt: readonly [number, number];
  /** The basin's second mode, in scene units: positive lifts the middle and drops the rim. */
  readonly swell: number;
  /** How disturbed the water is, 0 still to 1 choppy, for the fine ripples. */
  readonly ripple: number;
  /** Seconds the water has been moving, which the ripples travel by. */
  readonly time: number;
  /**
   * Advances `seconds` with gravity pointing along `down` (in the vessel's frame, any length).
   * Returns true while the surface is still moving.
   */
  step: (seconds: number, down: readonly [number, number, number]) => boolean;
  /** A jolt through the water, such as the cap cracking off: 0 none to 1 hard. */
  jolt: (strength: number) => void;
};

export function createSlosh(options: SloshOptions = defaultSloshOptions): Slosh {
  const omega = 2 * Math.PI * options.frequency;
  const swellOmega = omega * swellRatio;
  const tilt: [number, number] = [0, 0];
  const tiltSpeed: [number, number] = [0, 0];
  let swell = 0;
  let swellSpeed = 0;
  let ripple = 0;
  let time = 0;
  let moving = false;

  /** The slope the water settles at for gravity along `down`, partly levelled and capped. */
  function rest([x, y, z]: readonly [number, number, number]): [number, number] {
    // Level water leans by -down.x / down.y along x (and likewise z); upside down it cannot settle, so keep to the cap.
    const below = Math.max(-y, 1e-3);
    let sx = (options.gravity * x) / below;
    let sz = (options.gravity * z) / below;
    const steepness = Math.hypot(sx, sz);
    if (steepness > 0) {
      // Eases into the cap rather than stopping dead at it.
      const capped = options.maxTilt * Math.tanh(steepness / options.maxTilt);
      sx *= capped / steepness;
      sz *= capped / steepness;
    }
    return [sx, sz];
  }

  function energy(target: [number, number]) {
    const lean = (tilt[0] - target[0]) ** 2 + (tilt[1] - target[1]) ** 2;
    const rocking = (tiltSpeed[0] ** 2 + tiltSpeed[1] ** 2) / (omega * omega);
    const heave = swell ** 2 + (swellSpeed / swellOmega) ** 2;
    return lean + rocking + heave + (ripple * 0.01) ** 2;
  }

  return {
    get tilt() {
      return tilt;
    },
    get swell() {
      return swell;
    },
    get ripple() {
      return ripple;
    },
    get time() {
      return time;
    },
    step(seconds, down) {
      const target = rest(down);
      const frame = Math.min(Math.max(seconds, 0), maxFrame);
      // Settled and still settled: nothing to integrate, nothing to draw.
      if (!moving && energy(target) < stillEnergy) return false;
      const steps = Math.ceil(frame / substep);
      const dt = steps ? frame / steps : 0;
      for (let i = 0; i < steps; i++) {
        let rocking = 0;
        // Semi-implicit Euler: speeds first, then positions from the new speeds.
        for (const axis of [0, 1] as const) {
          tiltSpeed[axis] += (omega * omega * (target[axis] - tilt[axis]) - 2 * options.damping * omega * tiltSpeed[axis]) * dt;
          tilt[axis] += tiltSpeed[axis] * dt;
          rocking += tiltSpeed[axis] ** 2;
        }
        swellSpeed += (-swellOmega * swellOmega * swell - 2 * options.damping * swellOmega * swellSpeed + coupling.swell * rocking * omega) * dt;
        swell += swellSpeed * dt;
        ripple += (coupling.ripple * Math.sqrt(rocking) * (1 - ripple) - coupling.rippleDecay * ripple) * dt;
      }
      time += frame;
      moving = energy(target) >= stillEnergy;
      if (!moving) {
        // Snap the last sliver, so a still surface is exactly at rest.
        tilt[0] = target[0];
        tilt[1] = target[1];
        tiltSpeed[0] = tiltSpeed[1] = swell = swellSpeed = ripple = 0;
      }
      return true;
    },
    jolt(strength) {
      swellSpeed += 0.08 * strength * swellOmega;
      ripple = Math.min(1, ripple + 0.6 * strength);
      moving = true;
    },
  };
}
