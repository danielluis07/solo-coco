// The pinned Hero, the Vitrine: holds the frame while scroll scrubs the master
// timeline through every Beat, the object's and the Copy's, and plays the entrance
// on load. Loaded on demand and only outside Static.
// Rules live in DESIGN.md § Hero choreography and § Performance, loading and
// runtime fallbacks (Loading order).

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import stage from "@/assets/hero/stage.json";
import { startHeroCopy } from "./hero-copy";
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

/**
 * Whether the visitor has scrolled into the Hero's range. With the Vitrine at the page
 * top its pin starts at 0, which ScrollTrigger moves to just above it, so the range
 * reads as begun before any scrolling.
 */
const scrolledIn = (trigger: ScrollTrigger) => trigger.scroll() > Math.max(trigger.start, 0);

/** Screen pixels per scene unit at the object's depth, for a poster this tall. */
function pixelsPerUnit(height: number) {
  const distance = stage.camera.position[2];
  return height / (2 * distance * Math.tan((stage.camera.fov * Math.PI) / 360));
}

export type HeroSequenceElements = {
  /**
   * The stage holding the poster and the canvas. It pins with the Vitrine's frame
   * (`[data-hero-pin]`), where the Copy moves around the object.
   */
  stage: HTMLElement;
  /** The poster's square, moved by the entrance exactly as the 3D coconut is. */
  poster: HTMLElement;
};

export type HeroSequence = {
  /** The visitor has scrolled into the Hero, so scroll owns the coconut. */
  scrolledIn: () => boolean;
  /** Ends the entrance where it stands, as when the visitor has already scrolled on. */
  skipEntrance: () => void;
  /** Releases the pin and puts the poster back. */
  stop: () => void;
};

export function startHeroSequence(rig: HeroRig, elements: HeroSequenceElements): HeroSequence {
  const { stage: object, poster } = elements;
  const pinned = object.closest<HTMLElement>("[data-hero-pin]") ?? object;
  const timeline = buildHeroTimeline(rig);
  const copy = startHeroCopy(rig, pinned);
  timeline.eventCallback("onUpdate", copy.render);
  copy.render();
  let entrance: gsap.core.Timeline | null = null;

  const skipEntrance = () => {
    copy.settle();
    if (!entrance?.isActive()) return;
    entrance.progress(1);
    object.dataset.entrance = "skipped";
  };

  let context: gsap.Context | null = null;
  let trigger: ScrollTrigger | null = null;
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
      trigger = ScrollTrigger.create({
        trigger: pinned,
        animation: timeline,
        scrub: smoothing,
        invalidateOnRefresh: true,
        // The Hero comes before the statement, so it measures first.
        refreshPriority: 1,
        // Scroll owns the coconut from the first scrolled pixel; the entrance gives way.
        onUpdate: (self) => {
          if (scrolledIn(self)) skipEntrance();
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

  // Keyboard focus on the frame's link brings back the Beat it belongs to, the intro, at
  // once, rather than leaving it faded out or wiped away (DESIGN.md § Accessibility).
  const onFocus = (event: FocusEvent) => {
    if (!trigger || !scrolledIn(trigger) || !(event.target as Element).matches(":focus-visible")) return;
    window.scrollTo({ top: Math.max(trigger.start, 0), behavior: "instant" });
    ScrollTrigger.update();
    trigger.getTween()?.progress(1);
  };
  pinned.addEventListener("focusin", onFocus);

  const showEntrance = () => {
    const { y, scale, rotZ } = rig.entrance;
    poster.style.transform = `translateY(${-y * pixelsPerUnit(poster.offsetHeight)}px) rotate(${-rotZ}rad) scale(${scale})`;
  };

  // The entrance plays on load, on the poster and then the 3D coconut, from a composed first frame.
  if (scrollY === 0 && !(trigger && scrolledIn(trigger))) {
    object.dataset.entrance = "playing";
    entrance = playEntrance(rig)
      .eventCallback("onUpdate", showEntrance)
      .eventCallback("onComplete", () => {
        object.dataset.entrance = "done";
      });
    showEntrance();
  } else {
    copy.settle();
    object.dataset.entrance = "skipped";
  }

  return {
    scrolledIn: () => (trigger ? scrolledIn(trigger) : false),
    skipEntrance,
    stop: () => {
      removeEventListener("resize", onResize);
      pinned.removeEventListener("focusin", onFocus);
      clearTimeout(settle);
      entrance?.progress(1).kill();
      context?.revert();
      timeline.kill();
      copy.clear();
      poster.style.transform = "";
      delete object.dataset.pinned;
      delete object.dataset.entrance;
    },
  };
}
