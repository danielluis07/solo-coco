"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { Group, Vector3 } from "three";
import stage from "@/assets/hero/stage.json";
import { createFpsSampler } from "@/lib/fps-sampler";
import { loadHeroAssets, type HeroAssets } from "@/lib/hero-assets";
import type { HeroRig } from "@/lib/hero-rig";

// The live Hero: the generated coconut and can, posed from the rig every frame.
// Client-only and loaded on demand. Rules live in DESIGN.md § Hero choreography and
// § Performance, loading and runtime fallbacks.

/** Ignored at the start of the animation, while shaders compile and textures upload. */
const fpsWarmUpMs = 1_000;

/** Pixel-ratio cap per tier. */
const pixelRatio = { full: 1.5, lite: 1 };

export type HeroSceneEvents = {
  /** A complete first frame is on screen. */
  onFirstFrame: () => void;
  /** An essential asset failed, the context was lost or rendering threw. */
  onFailure: () => void;
  /** One measured frame-rate window, for the Motion-tier policy. */
  onFps: (fps: number) => void;
  /** Rendering stopped (offscreen, tab hidden) or started again. */
  onRendering: (rendering: boolean) => void;
};

type Props = HeroSceneEvents & { rig: HeroRig; tier: "full" | "lite" };

export default function HeroScene({ rig, tier, ...events }: Props) {
  return (
    <Canvas
      frameloop="never"
      flat
      dpr={tier === "full" ? [1, pixelRatio.full] : pixelRatio.lite}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: stage.camera.fov, position: stage.camera.position as [number, number, number], near: 0.1, far: 50 }}
      // R3F turns pointer events back on for its wrapper; the scene is decoration only.
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <hemisphereLight args={[stage.hemisphere.sky, stage.hemisphere.ground, stage.hemisphere.intensity]} />
      <directionalLight position={stage.sun.position as [number, number, number]} intensity={stage.sun.intensity} />
      <Driver rig={rig} {...events} />
    </Canvas>
  );
}

/** Loads the assets, then renders whenever the rig moves while the Hero is in view. */
function Driver({ rig, ...props }: HeroSceneEvents & { rig: HeroRig }) {
  const store = useThree((state) => state.get);
  // The latest callbacks, without restarting the loop when the parent re-renders.
  const events = useRef(props);
  useEffect(() => {
    events.current = props;
  });

  useEffect(() => {
    const { gl, scene, camera, advance } = store();
    let assets: HeroAssets | null = null;
    let stopped = false;
    let failed = false;
    const fail = () => {
      if (stopped || failed) return;
      failed = true;
      stop();
      events.current.onFailure();
    };

    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", fail);

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const sampler = createFpsSampler({ warmUpMs: fpsWarmUpMs, onWindow: (fps) => events.current.onFps(fps) });
    let rendering = true;
    let last: number[] = [];

    const tick = (seconds: number) => {
      if (!assets) return;
      const now = seconds * 1000;
      const active = visible && !document.hidden;
      if (active !== rendering) {
        rendering = active;
        events.current.onRendering(active);
      }
      if (!active) {
        sampler.tick(now, false);
        return;
      }
      const { size } = store();
      const next = [...posed(rig), size.width, size.height];
      const moving = rig.shake > 0 || next.some((value, i) => value !== last[i]);
      last = next;
      if (moving) {
        pose(assets, rig, seconds);
        render(now);
      }
      sampler.tick(now, moving);
    };

    const render = (now: number) => {
      try {
        advance(now);
      } catch {
        fail();
      }
    };

    function stop() {
      stopped = true;
      gsap.ticker.remove(tick);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", fail);
    }

    loadHeroAssets(gl)
      .then(async (loaded) => {
        if (stopped) return loaded.dispose();
        assets = loaded;
        scene.add(loaded.coconut.root, loaded.can);
        pose(loaded, rig, 0);
        // Compile before the first frame, so it is complete when it lands.
        await gl.compileAsync(scene, camera);
        if (stopped) return;
        render(performance.now());
        // The frame is presented on the next animation frame.
        requestAnimationFrame(() => {
          if (stopped) return;
          last = [];
          gsap.ticker.add(tick);
          events.current.onRendering(true);
          events.current.onFirstFrame();
        });
      })
      .catch(fail);

    return () => {
      stop();
      if (assets) {
        scene.remove(assets.coconut.root, assets.can);
        assets.dispose();
      }
    };
  }, [store, rig]);

  return null;
}

/** Every rig value a frame depends on. */
function posed(rig: HeroRig) {
  const { coconut, cap, can, entrance } = rig;
  return [
    coconut.y,
    coconut.scale,
    coconut.rotX,
    coconut.rotY,
    cap.lift,
    can.scale,
    can.rotY,
    entrance.y,
    entrance.scale,
    entrance.rotZ,
  ];
}

const capBase = new WeakMap<object, Vector3>();

/** Applies the rig to the scene graph; the shake needs the clock. */
function pose({ coconut, can }: HeroAssets, rig: HeroRig, seconds: number) {
  const shake = rig.shake * 0.05;
  const root = coconut.root as Group;
  const scale = rig.coconut.scale * rig.entrance.scale;
  root.visible = scale > 0.001;
  root.position.set(Math.sin(seconds * 53) * shake, rig.coconut.y + rig.entrance.y + Math.sin(seconds * 41) * shake * 0.6, 0);
  root.rotation.set(rig.coconut.rotX, rig.coconut.rotY, rig.entrance.rotZ + Math.sin(seconds * 47) * shake * 1.5);
  root.scale.setScalar(Math.max(scale, 0.0001));

  // Whole until the machete; then the two halves, the cap lifting off its crack line.
  const { lift } = rig.cap;
  coconut.whole.visible = lift === 0;
  coconut.top.visible = coconut.bottom.visible = lift > 0;
  let base = capBase.get(coconut.top);
  if (!base) capBase.set(coconut.top, (base = coconut.top.position.clone()));
  coconut.top.position.set(base.x, base.y + lift * 2.6, base.z - lift * 0.3);
  coconut.top.rotation.x = -lift * 0.5;

  can.visible = rig.can.scale > 0.001;
  can.scale.setScalar(Math.max(rig.can.scale, 0.0001));
  can.rotation.y = rig.can.rotY;
}
