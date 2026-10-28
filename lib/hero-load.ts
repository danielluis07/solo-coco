// Turns deferred Hero loading into Motion-tier events: started, then exactly one
// of ready, failed or timed out. One attempt per visit; reloading tries again.
// Rules live in DESIGN.md § Performance, loading and runtime fallbacks (Failure behavior).

import { loadTimeoutMs, type MotionEvent } from "./motion-tier";

export type HeroLoadGuard = {
  /** Stops listening, as when the page leaves 3D for another reason. */
  cancel: () => void;
};

export function guardHeroLoad({
  load,
  dispatch,
  timeoutMs = loadTimeoutMs,
}: {
  /** Resolves once a complete first 3D frame is on screen; rejects on an essential failure. */
  load: () => Promise<unknown>;
  dispatch: (event: MotionEvent) => void;
  timeoutMs?: number;
}): HeroLoadGuard {
  let settled = false;
  const settle = (event: MotionEvent) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    dispatch(event);
  };

  dispatch({ type: "load-started" });
  const timer = setTimeout(() => settle({ type: "load-timed-out" }), timeoutMs);
  load().then(
    () => settle({ type: "first-frame-ready" }),
    () => settle({ type: "asset-failed" }),
  );

  return {
    cancel: () => {
      settled = true;
      clearTimeout(timer);
    },
  };
}
