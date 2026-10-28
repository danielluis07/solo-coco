"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createHeroRig } from "@/lib/hero-rig";
import { guardHeroLoad, type HeroLoadGuard } from "@/lib/hero-load";
import type { HeroSequence } from "@/lib/hero-sequence";
import { dispatchMotion, useMotion } from "./motion-provider";
import type { HeroSceneEvents } from "./hero-scene";

// The Hero's object: the server-rendered poster, and outside Static the live 3D
// scene laid over it once its first frame is complete. Rules live in DESIGN.md
// § Performance, loading and runtime fallbacks.

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });

type Phase = "poster" | "loading" | "3d";

/** Resolves or rejects from outside, for the scene's first frame. */
function deferred() {
  let resolve!: () => void;
  let reject!: () => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Runs `then` once the poster has painted and the browser is idle, so input comes first. */
function afterPaint(then: () => void) {
  // Safari has no requestIdleCallback; a timeout still yields to pending input.
  const idleSupported = typeof requestIdleCallback === "function";
  let idle = 0;
  const frame = requestAnimationFrame(() => {
    idle = idleSupported ? requestIdleCallback(then, { timeout: 1_000 }) : window.setTimeout(then, 0);
  });
  return () => {
    cancelAnimationFrame(frame);
    if (idleSupported) cancelIdleCallback(idle);
    else clearTimeout(idle);
  };
}

export function HeroStage({ children }: { children: ReactNode }) {
  const { motion } = useMotion();
  const tier = motion?.tier ?? null;
  const live = tier === "full" || tier === "lite";
  const startLoading = motion?.startLoading ?? false;
  const [rig] = useState(createHeroRig);
  const [phase, setPhase] = useState<Phase>("poster");
  const stage = useRef<HTMLDivElement>(null);
  const poster = useRef<HTMLDivElement>(null);
  const sequence = useRef<HeroSequence | null>(null);
  const loading = useRef<{ guard: HeroLoadGuard; firstFrame: ReturnType<typeof deferred> } | null>(null);

  // A layout effect, so entering Static releases the pin before the
  // controller puts the visible content and focus back.
  useLayoutEffect(() => {
    if (!live) return;
    let cancelled = false;
    import("@/lib/hero-sequence").then(({ startHeroSequence }) => {
      if (cancelled || !stage.current || !poster.current) return;
      sequence.current = startHeroSequence(rig, { stage: stage.current, poster: poster.current });
    });
    return () => {
      cancelled = true;
      sequence.current?.stop();
      sequence.current = null;
    };
  }, [live, rig]);

  // Deferred loading starts once the policy asks, after the poster paints. One attempt per visit.
  useEffect(() => {
    if (!startLoading || loading.current) return;
    return afterPaint(() => {
      const firstFrame = deferred();
      loading.current = { firstFrame, guard: guardHeroLoad({ load: () => firstFrame.promise, dispatch: dispatchMotion }) };
      setPhase("loading");
    });
  }, [startLoading]);

  // Leaving 3D for any reason ends the attempt; Static holds for the visit.
  useEffect(() => {
    if (live) return;
    loading.current?.guard.cancel();
    if (stage.current) delete stage.current.dataset.rendering;
  }, [live]);

  const events: HeroSceneEvents = {
    onFirstFrame: () => {
      // A visitor who has scrolled on keeps their place and skips the entrance.
      if ((sequence.current?.unit() ?? 0) > 0) sequence.current?.skipEntrance();
      loading.current?.firstFrame.resolve();
      setPhase("3d");
    },
    onFailure: () => {
      if (phase === "3d") dispatchMotion({ type: "render-failed" });
      else loading.current?.firstFrame.reject();
    },
    onFps: (fps) => dispatchMotion({ type: "fps-measured", fps }),
    onRendering: (rendering) => {
      if (stage.current) stage.current.dataset.rendering = rendering ? "on" : "paused";
    },
  };

  const showScene = live && phase !== "poster";
  const showing3d = showScene && phase === "3d";

  return (
    <div
      ref={stage}
      data-hero-stage={showing3d ? "3d" : "poster"}
      className="relative mx-auto aspect-square w-full max-w-sm rounded-board bg-isopor shadow-board md:w-sm">
      <div ref={poster} className={`absolute inset-0 ${showing3d ? "invisible" : ""}`}>
        {children}
      </div>
      {showScene && (
        // Decorative: hidden from assistive technology and never focusable or hit by the pointer.
        <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${showing3d ? "" : "opacity-0"}`}>
          <SceneBoundary onError={events.onFailure}>
            <HeroScene rig={rig} tier={tier} {...events} />
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}

/** A scene that fails to load or render leaves the poster, never an error screen. */
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
