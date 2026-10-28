// Paints the Vitrine from the rig, straight onto the DOM, so scrolling never
// re-renders React: the Copy around the object, the badges, the meter, and Saída's
// wipe onto the brand statement. The elements are the Hero's own markup
// (components/hero.tsx), found by their `data-vitrine` group.
// Rules live in DESIGN.md § Hero choreography: Vitrine.

import { copy } from "@/content/page";
import { aboveHandCut } from "./hand-cut";
import type { HeroRig } from "./hero-rig";
import { meterStage } from "./hero-timeline";

const { meterLabels, counter } = copy.hero.transformation;

/** An [x, y] offset in px. */
type Offset = readonly [number, number];

/** How far a piece travels as it arrives and, if it leaves, as it goes. */
type Travel = { arrive: Offset; leave?: Offset };

/** Each group's pieces in markup order; the last entry serves any piece after it. */
const travel = {
  intro: [{ arrive: [0, 40], leave: [0, -60] }],
  opened: [{ arrive: [0, 60], leave: [0, -50] }],
  // Both rise into place; Saída takes them away.
  closing: [{ arrive: [0, 40] }, { arrive: [0, 30] }],
} satisfies Record<keyof HeroRig["copy"], Travel[]>;

/** The meter rises into place, and fades without moving as it goes. */
const meterTravel: Travel = { arrive: [0, 20] };

/**
 * Each badge's extra tilt by the time it leaves the frame, in degrees, on top of its
 * resting tilt. Kept small, so a badge at a phone's edge stays within the screen.
 */
const badgeSwing = [-8, 6, 8];

/** How far the badges drift, in frame heights, from below the frame to clear above it. */
const badgeDrift = 1.5;

type Group = keyof typeof travel;

export type HeroCopy = {
  /** Writes the rig's current state onto the page. */
  render: () => void;
  /** Ends the intro's settle-in, as when scroll takes over. */
  settle: () => void;
  /** Takes back every style written, for the Static layout. */
  clear: () => void;
};

/** Paints the rig onto `frame`, the Vitrine's pinned frame, and the pieces inside it. */
export function startHeroCopy(rig: HeroRig, frame: HTMLElement): HeroCopy {
  const all = (group: string) => Array.from(frame.querySelectorAll<HTMLElement>(`[data-vitrine="${group}"]`));
  const pieces: Record<Group, HTMLElement[]> = { intro: all("intro"), opened: all("opened"), closing: all("closing") };
  const badges = all("badge");
  const [meter] = all("meter");
  const count = meter?.querySelector<HTMLElement>("[data-meter-count]");
  const label = meter?.querySelector<HTMLElement>("[data-meter-label]");
  const bar = meter?.querySelector<HTMLElement>("[data-meter-bar]");
  const written = new Set<HTMLElement>();
  const last = new Map<HTMLElement, string>();

  const write = (el: HTMLElement | null | undefined, style: { opacity?: string; transform?: string; translate?: string; clipPath?: string }) => {
    if (!el) return;
    const key = JSON.stringify(style);
    if (last.get(el) === key) return;
    last.set(el, key);
    written.add(el);
    Object.assign(el.style, style);
  };
  const text = (el: HTMLElement | null | undefined, value: string) => {
    if (el && el.textContent !== value) el.textContent = value;
  };

  /** A piece at 0 waits below its place, at 1 is in place, at 2 has gone. */
  const place = (el: HTMLElement, at: number, { arrive, leave = [0, 0] }: Travel) => {
    const [x, y] = at <= 1 ? arrive.map((d) => d * (1 - at)) : leave.map((d) => d * (at - 1));
    const opacity = at <= 1 ? at : 2 - at;
    write(el, { opacity: String(round(opacity)), transform: `translate(${round(x)}px, ${round(y)}px)` });
  };

  const render = () => {
    for (const group of Object.keys(pieces) as Group[]) {
      pieces[group].forEach((el, i) => {
        const state = rig.copy[group][i];
        const moves = travel[group];
        if (state) place(el, state.at, moves[Math.min(i, moves.length - 1)]);
      });
    }

    const height = frame.offsetHeight;
    badges.forEach((el, i) => {
      const drift = rig.badges[i]?.drift ?? 0;
      // The drift goes on `translate`, which applies before the resting tilt (`rotate`), so
      // the tilt turns the badge about its own centre rather than swinging its path.
      write(el, { transform: `rotate(${round(drift * badgeSwing[i])}deg)`, translate: `0 ${round(-drift * height * badgeDrift)}px` });
    });

    if (meter) {
      place(meter, rig.meter.at, meterTravel);
      text(count, String(Math.round(rig.meter.count)).padStart(3, "0"));
      text(label, meterLabels[meterStage(rig.meter.count)]);
      write(bar, { transform: `scaleX(${round(rig.meter.count / 100)})` });
    }

    // Saída: the statement beneath shows through as the hand-cut edge climbs the frame.
    write(frame, { clipPath: rig.panel.rise > 0 ? aboveHandCut(1 - rig.panel.rise) : "" });
  };

  return {
    render,
    settle: () => {
      for (const el of pieces.intro) for (const animation of el.getAnimations()) animation.finish();
    },
    clear: () => {
      for (const el of written) {
        for (const property of ["opacity", "transform", "translate", "clip-path"]) el.style.removeProperty(property);
      }
      written.clear();
      last.clear();
      text(count, counter.from);
      text(label, meterLabels[0]);
    },
  };
}

const round = (value: number) => Math.round(value * 1000) / 1000;
