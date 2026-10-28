// Paints the Vitrine's Copy, badges, meter and Saída panel from the rig, straight
// onto the DOM, so scrolling never re-renders React. The elements are the Hero's
// own markup (components/hero.tsx), found by their `data-vitrine` Beat.
// Rules live in DESIGN.md § Hero choreography: Vitrine.

import { copy } from "@/content/page";
import type { HeroRig } from "./hero-rig";
import { meterStage } from "./hero-timeline";

const { meterLabels } = copy.hero.transformation;

/** How far a piece of Copy travels as it arrives and as it leaves, in px; [x, y]. */
const travel = {
  intro: { arrive: [0, 40], leave: [0, -60] },
  opened: { arrive: [0, 60], leave: [0, -50] },
  closing: { arrive: [-80, 30], leave: [0, 0] },
} as const;

/** The closing body line rises into place instead of sliding in. */
const closingBodyArrive = [0, 30] as const;

/**
 * Each badge's extra tilt by the time it leaves the frame, in degrees, on top of its
 * resting tilt. Kept small, so a badge at a phone's edge stays within the screen.
 */
const badgeTilt = [-8, 6, 8];

/** How far the badges drift, in frame heights, from below the frame to clear above it. */
const badgeDrift = 1.5;

type Beat = keyof typeof travel;

export type HeroCopy = {
  /** Writes the rig's current state onto the page. */
  render: () => void;
  /** Ends the intro's settle-in, as when scroll takes over. */
  settle: () => void;
  /** Takes back every style written, for the Static layout. */
  clear: () => void;
};

export function startHeroCopy(rig: HeroRig, frame: HTMLElement): HeroCopy {
  const all = (beat: string) => Array.from(frame.querySelectorAll<HTMLElement>(`[data-vitrine="${beat}"]`));
  const pieces = { intro: all("intro"), opened: all("opened"), closing: all("closing") };
  const badges = all("badge");
  const [meter] = all("meter");
  const [panel] = all("panel");
  const count = meter?.querySelector<HTMLElement>("[data-meter-count]");
  const label = meter?.querySelector<HTMLElement>("[data-meter-label]");
  const bar = meter?.querySelector<HTMLElement>("[data-meter-bar]");
  const written = new Set<HTMLElement>();
  const last = new Map<HTMLElement, string>();

  const write = (el: HTMLElement | null | undefined, opacity: string, transform: string, translate = "") => {
    if (!el) return;
    const key = `${opacity}|${transform}|${translate}`;
    if (last.get(el) === key) return;
    last.set(el, key);
    written.add(el);
    el.style.opacity = opacity;
    el.style.transform = transform;
    el.style.translate = translate;
  };
  const text = (el: HTMLElement | null | undefined, value: string) => {
    if (el && el.textContent !== value) el.textContent = value;
  };

  /** A piece at 0 waits below its place, at 1 is in place, at 2 has gone. */
  const place = (el: HTMLElement, at: number, arrive: readonly number[], leave: readonly number[]) => {
    const [x, y] = at <= 1 ? arrive.map((d) => d * (1 - at)) : leave.map((d) => d * (at - 1));
    const opacity = at <= 1 ? at : 2 - at;
    write(el, String(round(opacity)), `translate(${round(x)}px, ${round(y)}px)`);
  };

  const render = () => {
    for (const beat of Object.keys(pieces) as Beat[]) {
      pieces[beat].forEach((el, i) => {
        const state = rig.copy[beat][i];
        if (!state) return;
        const arrive = beat === "closing" && i > 0 ? closingBodyArrive : travel[beat].arrive;
        place(el, state.at, arrive, travel[beat].leave);
      });
    }

    const height = frame.offsetHeight;
    badges.forEach((el, i) => {
      const drift = rig.badges[i]?.drift ?? 0;
      // The drift goes on `translate`, which applies before the resting tilt (`rotate`), so
      // the tilt turns the badge about its own centre rather than swinging its path.
      write(el, "1", `rotate(${round(drift * badgeTilt[i])}deg)`, `0 ${round(-drift * height * badgeDrift)}px`);
    });

    if (meter) {
      place(meter, rig.meter.at, [0, 20], [0, 0]);
      const value = Math.round(rig.meter.count);
      text(count, String(value).padStart(3, "0"));
      text(label, meterLabels[meterStage(rig.meter.count)]);
      write(bar, "1", `scaleX(${round(rig.meter.count / 100)})`);
    }

    write(panel, "1", `translateY(${round((1 - rig.panel.rise) * 100)}%)`);
  };

  return {
    render,
    settle: () => {
      for (const el of pieces.intro) for (const animation of el.getAnimations()) animation.finish();
    },
    clear: () => {
      for (const el of written) {
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
        el.style.removeProperty("translate");
      }
      written.clear();
      last.clear();
      text(count, copy.hero.transformation.counter.from);
      text(label, meterLabels[0]);
    },
  };
}

const round = (value: number) => Math.round(value * 1000) / 1000;
