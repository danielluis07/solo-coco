// The pinned Hero: holds the stage centred while scroll scrubs the master
// timeline, and plays the entrance on load. Loaded on demand and only outside Static.
// Rules live in DESIGN.md § Hero choreography and § Performance, loading and
// runtime fallbacks (Loading order).

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import stage from "@/assets/hero/stage.json";
import type { HeroRig } from "./hero-rig";
import { buildHeroTimeline, playEntrance } from "./hero-timeline";
import { phoneQuery } from "./motion-signals";
import { captureViewport, restoreViewport } from "./viewport-snapshot";

gsap.registerPlugin(ScrollTrigger);

/** Scroll the pin adds, in viewport heights. */
const pinLength = { desktop: 7, phone: 6 };

/** Seconds the scene takes to catch up with the scroll position. */
const smoothing = 1.2;

/** Waits out ScrollTrigger's own resize refresh before measuring again. */
const resizeSettleMs = 250;

/** Screen pixels per scene unit at the object's depth, for a stage this tall. */
function pixelsPerUnit(height: number) {
  const distance = stage.camera.position[2];
  return height / (2 * distance * Math.tan((stage.camera.fov * Math.PI) / 360));
}

export type HeroSequenceElements = {
  /**
   * The square stage holding the poster and the canvas. It pins with its row
   * (`[data-hero-pin]`), so the Copy around the object holds with it.
   */
  stage: HTMLElement;
  /** The poster, moved by the entrance exactly as the 3D coconut is. */
  poster: HTMLElement;
};

export type HeroSequence = {
  /** Where the scroll has the timeline, in units 0–100. */
  unit: () => number;
  /** Ends the entrance where it stands, as when the visitor has already scrolled on. */
  skipEntrance: () => void;
  /** Releases the pin and puts the poster back. */
  stop: () => void;
};

export function startHeroSequence(rig: HeroRig, elements: HeroSequenceElements): HeroSequence {
  const { stage: object, poster } = elements;
  const pinned = object.closest<HTMLElement>("[data-hero-pin]") ?? object;
  const timeline = buildHeroTimeline(rig);
  let entrance: gsap.core.Timeline | null = null;

  const skipEntrance = () => {
    if (!entrance?.isActive()) return;
    entrance.progress(1);
    object.dataset.entrance = "skipped";
  };

  let context: gsap.Context | null = null;
  let pinning: boolean | null = null;
  let settle: ReturnType<typeof setTimeout> | undefined;

  // A row taller than the viewport would be cut off while pinned, so it scrubs in flow.
  const update = () => {
    const fits = pinned.offsetHeight <= innerHeight;
    if (fits === pinning) return;
    pinning = fits;
    context?.revert();
    object.dataset.pinned = String(fits);
    context = gsap.context(() => {
      const length = () => (matchMedia(phoneQuery).matches ? pinLength.phone : pinLength.desktop);
      ScrollTrigger.create({
        trigger: pinned,
        animation: timeline,
        scrub: smoothing,
        invalidateOnRefresh: true,
        // The Hero comes before the statement, so it measures first.
        refreshPriority: 1,
        // Scroll owns the coconut from the first scrolled pixel; the entrance gives way.
        onUpdate: (self) => {
          if (self.progress > 0) skipEntrance();
        },
        ...(fits
          ? { pin: true, start: "center center", end: () => `+=${innerHeight * length()}` }
          : { start: "top bottom", end: "bottom top" }),
      });
    });
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  };

  const onResize = () => {
    clearTimeout(settle);
    settle = setTimeout(update, resizeSettleMs);
  };

  // The pin adds scroll below the row; keep whatever the visitor is looking at in place.
  const before = scrollY > 0 ? captureViewport() : null;
  update();
  if (before) restoreViewport(before);
  addEventListener("resize", onResize);

  const showEntrance = () => {
    const { y, scale, rotZ } = rig.entrance;
    poster.style.transform = `translateY(${-y * pixelsPerUnit(object.offsetHeight)}px) rotate(${-rotZ}rad) scale(${scale})`;
  };

  // The entrance plays on load, on the poster and then the 3D coconut, from a composed first frame.
  if (timeline.progress() === 0 && scrollY === 0) {
    object.dataset.entrance = "playing";
    entrance = playEntrance(rig)
      .eventCallback("onUpdate", showEntrance)
      .eventCallback("onComplete", () => {
        object.dataset.entrance = "done";
      });
    showEntrance();
  } else {
    object.dataset.entrance = "skipped";
  }

  return {
    unit: () => timeline.time(),
    skipEntrance,
    stop: () => {
      removeEventListener("resize", onResize);
      clearTimeout(settle);
      entrance?.progress(1).kill();
      context?.revert();
      timeline.kill();
      poster.style.transform = "";
      delete object.dataset.pinned;
      delete object.dataset.entrance;
    },
  };
}
