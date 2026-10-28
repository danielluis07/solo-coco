// The pinned brand statement: "Coco." holds while the Letreiro plaque cycles
// its phrases. Loaded on demand and only outside Static.
// Rules live in DESIGN.md § Statement and product interactions (Rotating statement).

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { phoneQuery } from "./motion-signals";

gsap.registerPlugin(ScrollTrigger);

/** Extra scroll the pin adds, in viewport heights. */
const pinLength = { desktop: 2, phone: 1.5 };

/** Seconds the plaque takes to catch up with the scroll position. */
const smoothing = 0.4;

/** Each plaque slide's start and end, as fractions of the statement's scroll range. */
const slides = [
  [0.25, 0.35],
  [0.65, 0.75],
] as const;

/** Waits out ScrollTrigger's own resize refresh before measuring again. */
const resizeSettleMs = 250;

export type StatementElements = {
  /** Held in place for the sequence; its first child is the measured content. */
  pinned: HTMLElement;
  /** The column of plaque phrases, one phrase tall in view. */
  track: HTMLElement;
};

export type StatementSequence = {
  /** Releases the pin and puts the plaque back on its first phrase. */
  stop: () => void;
};

export function startStatementSequence({ pinned, track }: StatementElements): StatementSequence {
  let context: gsap.Context | null = null;
  let pinning: boolean | null = null;
  let settle: ReturnType<typeof setTimeout> | undefined;

  // Content taller than the viewport would be cut off while pinned, so it stays in flow.
  const fits = () => (pinned.firstElementChild as HTMLElement).offsetHeight <= innerHeight;

  const update = () => {
    const next = fits();
    if (next === pinning) return;
    pinning = next;
    context?.revert();
    context = null;
    pinned.dataset.pinned = String(next);
    if (!next) return;

    context = gsap.context(() => {
      const phrases = track.childElementCount;
      const length = () => (matchMedia(phoneQuery).matches ? pinLength.phone : pinLength.desktop);
      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: pinned,
          pin: true,
          start: "top top",
          end: () => `+=${innerHeight * length()}`,
          scrub: smoothing,
          invalidateOnRefresh: true,
        },
      });
      slides.forEach(([from, to], i) => {
        timeline.to(track, { yPercent: (-100 * (i + 1)) / phrases, duration: to - from }, from);
      });
      // Holds the last phrase until the end of the range.
      timeline.set({}, {}, 1);
    });
  };

  const onResize = () => {
    clearTimeout(settle);
    settle = setTimeout(update, resizeSettleMs);
  };

  update();
  addEventListener("resize", onResize);

  return {
    stop: () => {
      removeEventListener("resize", onResize);
      clearTimeout(settle);
      context?.revert();
      delete pinned.dataset.pinned;
    },
  };
}
