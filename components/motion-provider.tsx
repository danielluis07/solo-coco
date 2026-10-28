"use client";

import {
  createContext,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { anchorTargetOf, goToAnchor } from "@/lib/anchor-navigation";
import { markVitrineLayout, readMotionInputs, reducedMotionQuery, rememberOptOut } from "@/lib/motion-signals";
import {
  initialMotionState,
  motionOutput,
  nextMotionState,
  type MotionEvent,
  type MotionOutput,
  type MotionState,
} from "@/lib/motion-tier";
import type { SmoothScroll } from "@/lib/smooth-scroll";
import { captureViewport, restoreViewport, type ViewportSnapshot } from "@/lib/viewport-snapshot";

// The Motion controller: feeds the browser into the Motion-tier policy and
// publishes the tier. Rules live in DESIGN.md § Accessibility (Motion
// preferences and visitor control, Reading order and navigation).

// One policy state per page instance, shared by every subscriber.
let state: MotionState | null = null;
// Taken just before the page enters Static, restored once the change is committed.
let beforeStatic: ViewportSnapshot | null = null;
const listeners = new Set<() => void>();

// What React sees: changes only with the tier or the loading signal, so the policy's
// own bookkeeping (such as counting low-fps windows mid-scroll) never re-renders the page.
let output: MotionOutput | null = null;

function currentState() {
  state ??= initialMotionState(readMotionInputs());
  return state;
}

function currentOutput() {
  const next = motionOutput(currentState());
  if (output?.tier !== next.tier || output.startLoading !== next.startLoading) output = next;
  return output;
}

/** Sends a runtime event to the policy. */
export function dispatchMotion(event: MotionEvent) {
  const current = currentState();
  const next = nextMotionState(current, event);
  if (next === current) return;
  if (next.tier === "static") beforeStatic = captureViewport();
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** “Desativar animações”: Static for the rest of the visit, remembered across reloads. */
function optOut() {
  rememberOptOut();
  dispatchMotion({ type: "opted-out" });
}

type MotionContextValue = {
  /** `null` until the browser has been read; nothing animates or loads meanwhile. */
  motion: MotionOutput | null;
  optOut: () => void;
};

const MotionContext = createContext<MotionContextValue>({ motion: null, optOut });

export function useMotion() {
  return use(MotionContext);
}

export function MotionProvider({ children }: { children: ReactNode }) {
  // The server knows nothing about the visitor, so it renders the undecided state.
  const motion = useSyncExternalStore(subscribe, currentOutput, () => null);
  const tier = motion?.tier ?? null;
  const moving = tier !== null && tier !== "static";
  const smooth = useRef<SmoothScroll | null>(null);

  useEffect(() => {
    const query = matchMedia(reducedMotionQuery);
    const onChange = () => {
      if (query.matches) dispatchMotion({ type: "reduced-motion-enabled" });
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // A layout effect, ahead of the Static hand-over below: the tier decides the Hero's
  // layout in CSS, so the page must be laid out as Static before its position is restored.
  useLayoutEffect(() => {
    if (tier) document.documentElement.dataset.motionTier = tier;
  }, [tier]);

  // The inline script in the layout set this before the first paint; put it back
  // if React's development remount cleared it. A no-op in production.
  useLayoutEffect(() => {
    if (moving) markVitrineLayout();
  }, [moving]);

  // Lenis runs only outside Static, and is loaded only once that is known.
  useEffect(() => {
    if (!moving) return;
    let cancelled = false;
    import("@/lib/smooth-scroll").then(({ startSmoothScroll }) => {
      if (!cancelled) smooth.current = startSmoothScroll();
    });
    return () => {
      cancelled = true;
      smooth.current?.stop();
      smooth.current = null;
    };
  }, [moving]);

  // Entering Static releases pins and Lenis, then puts the visible content and focus back.
  useLayoutEffect(() => {
    if (tier !== "static") return;
    smooth.current?.stop();
    smooth.current = null;
    if (beforeStatic) restoreViewport(beforeStatic);
    beforeStatic = null;
  }, [tier]);

  // Every in-page link takes the same path, before and after any 3D loads.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = anchorTargetOf(event);
      if (!anchor) return;
      event.preventDefault();
      if (location.hash !== anchor.hash) history.pushState(null, "", anchor.hash);
      goToAnchor(anchor.target, smooth.current?.scrollTo);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return <MotionContext value={{ motion, optOut }}>{children}</MotionContext>;
}
