// Lenis smooth scrolling, driven by the GSAP ticker so ScrollTrigger and Lenis
// share one frame. Loaded on demand and only outside Static.

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type SmoothScroll = {
  scrollTo: (target: HTMLElement) => void;
  /** Releases every ScrollTrigger pin and removes Lenis. */
  stop: () => void;
};

export function startSmoothScroll(): SmoothScroll {
  const lenis = new Lenis({ autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (seconds: number) => lenis.raf(seconds * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return {
    // Measured from the real scroll position: Lenis's own can lag behind a
    // native scroll that lands mid-glide, which would send it to the old target.
    scrollTo: (target) => {
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      lenis.scrollTo(target.getBoundingClientRect().top + window.scrollY - margin, { force: true });
    },
    stop: () => {
      for (const trigger of ScrollTrigger.getAll()) trigger.kill();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    },
  };
}
