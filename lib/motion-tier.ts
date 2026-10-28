// The Motion-tier policy: decides whether the page runs Full, Lite or Static,
// and whether deferred 3D loading should start at all.
// Rules live in DESIGN.md § Performance, loading and runtime fallbacks and
// § Accessibility. Pure and DOM-free: callers read the browser, run the timers
// and measure frame rate, then feed the results in as inputs and events.

export type Tier = "full" | "lite" | "static";

export type DeviceClass = "phone" | "desktop";

/** What is known about the visitor and device before deferred 3D loading. */
export type MotionInputs = {
  /** `prefers-reduced-motion: reduce` matches. */
  reducedMotion: boolean;
  /** The visitor chose “Desativar animações” earlier in this visit. */
  optedOut: boolean;
  /** Data-saving mode is detectable and on. */
  dataSaving: boolean;
  deviceClass: DeviceClass;
  /** A WebGL context can be created. */
  webgl: boolean;
};

export type MotionEvent =
  | { type: "load-started" }
  | { type: "first-frame-ready" }
  | { type: "asset-failed" }
  /** No complete first 3D frame within `loadTimeoutMs` of `load-started`. */
  | { type: "load-timed-out" }
  /** The WebGL context was lost or an unrecoverable rendering error occurred. */
  | { type: "render-failed" }
  /**
   * Average fps over one `fpsWindowMs` window. Send only windows measured after
   * warm-up while the Hero is visible, the tab is active and animation runs.
   */
  | { type: "fps-measured"; fps: number }
  | { type: "reduced-motion-enabled" }
  | { type: "opted-out" };

/**
 * Where deferred 3D loading stands. `pending` means it should start;
 * `off` means it never will (or has stopped) for the rest of the visit.
 */
export type LoadPhase = "pending" | "loading" | "ready" | "off";

export type MotionState = {
  tier: Tier;
  load: LoadPhase;
  /** Consecutive fps windows below `minFps` since the last downgrade. */
  lowFpsWindows: number;
};

export type MotionOutput = {
  tier: Tier;
  /** Deferred 3D loading should start now. */
  startLoading: boolean;
};

export const loadTimeoutMs = 12_000;
export const fpsWindowMs = 3_000;
export const minFps = 30;
export const lowFpsWindowsToDowngrade = 2;

const staticState: MotionState = { tier: "static", load: "off", lowFpsWindows: 0 };

const stepDown: Record<Tier, Tier> = { full: "lite", lite: "static", static: "static" };

export function initialMotionState(inputs: MotionInputs): MotionState {
  if (inputs.reducedMotion || inputs.optedOut || inputs.dataSaving || !inputs.webgl) {
    return staticState;
  }
  // Phones start in Lite; desktops start in Full.
  const tier = inputs.deviceClass === "phone" ? "lite" : "full";
  return { tier, load: "pending", lowFpsWindows: 0 };
}

export function nextMotionState(state: MotionState, event: MotionEvent): MotionState {
  // Static holds for the rest of the visit; nothing upgrades out of it.
  if (state.tier === "static") return state;

  switch (event.type) {
    case "reduced-motion-enabled":
    case "opted-out":
    case "asset-failed":
    case "render-failed":
      return staticState;
    case "load-timed-out":
      // The timeout only applies while the first frame is still missing.
      return state.load === "ready" ? state : staticState;
    case "load-started":
      return state.load === "pending" ? { ...state, load: "loading" } : state;
    case "first-frame-ready":
      return state.load === "loading" ? { ...state, load: "ready" } : state;
    case "fps-measured": {
      if (state.load !== "ready") return state;
      if (event.fps >= minFps) return state.lowFpsWindows === 0 ? state : { ...state, lowFpsWindows: 0 };
      const lowFpsWindows = state.lowFpsWindows + 1;
      if (lowFpsWindows < lowFpsWindowsToDowngrade) return { ...state, lowFpsWindows };
      const tier = stepDown[state.tier];
      return tier === "static" ? staticState : { ...state, tier, lowFpsWindows: 0 };
    }
  }
}

export function motionOutput(state: MotionState): MotionOutput {
  return { tier: state.tier, startLoading: state.load === "pending" };
}
