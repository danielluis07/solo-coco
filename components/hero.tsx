import Image from "next/image";
import { copy } from "@/content/page";
import poster from "@/public/hero/poster.png";
import { BrushUnderline } from "./brand";
import { HeroStage } from "./hero-stage";

const { opening, opened, transformation, rotatingCan } = copy.hero;

// Small, irregular resting tilts so the badges never read as a regular grid.
const badgeTilt = ["-rotate-2", "rotate-[1.5deg]", "-rotate-1"];

/**
 * Where each badge drifts up through the Vitrine. The middle one passes behind
 * the object (z-0), the outer two in front of it (z-20), overlapping its edges on phones.
 */
const badgePlace = [
  "vitrine:z-20 vitrine:left-[18vw] max-sm:vitrine:left-[3vw]",
  "vitrine:z-0 vitrine:left-[56vw] max-sm:vitrine:left-[37vw]",
  "vitrine:z-20 vitrine:right-[14vw] max-sm:vitrine:right-[3vw]",
];

const display = "font-display leading-[0.9] tracking-[-0.02em]";

const splitLine = `${display} text-[clamp(2.25rem,7vw,4.5rem)]`;

/** All animated headlines share the opening headline's scale and rhythm. */
const headlineSize = "vitrine:text-[clamp(3.5rem,min(10vw,17svh),9rem)] max-sm:vitrine:text-[17vw]";
const headlineWidth = "vitrine:max-w-[88vw] max-sm:vitrine:max-w-[calc(100vw-2.5rem)]";

/** The Vitrine's gutters: the sides of the frame, and its top and bottom once the header has scrolled away. */
const left = "vitrine:left-[6vw] max-sm:vitrine:left-5";
const right = "vitrine:right-[6vw] max-sm:vitrine:right-5";
const top = "vitrine:top-[12svh] max-sm:vitrine:top-[8svh]";
const bottom = "vitrine:bottom-[12svh] max-sm:vitrine:bottom-[9svh]";

/** Copy waiting for its Beat is not painted until the timeline brings it in. */
const waiting = "vitrine:opacity-0";

/**
 * The Hero. In Static, the poster plus every Beat's Copy in normal page flow.
 * Outside Static, the Vitrine: one pinned frame where the same Copy moves around
 * the object, behind it (z-0) or in front of it (z-20), as scroll scrubs the Beats
 * (DESIGN.md § Hero choreography). Either way this markup is the accessible source
 * of the Hero Copy; only the painted meter is decoration.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      // The pin's spacer overlaps the statement's first screen; only the frame itself takes the pointer.
      className="mx-auto w-full max-w-6xl px-4 pt-6 pb-20 sm:px-8 vitrine:pointer-events-none vitrine:max-w-none vitrine:p-0">
      {/* Opaque and above the brand statement, which slides up beneath it during the last
          screen of the pin, for Saída to wipe the frame away onto it */}
      <div
        data-hero-pin
        className="vitrine:pointer-events-auto vitrine:relative vitrine:isolate vitrine:z-10 vitrine:h-svh vitrine:overflow-hidden vitrine:bg-polpa vitrine:bg-grain">
        {/* Girar: the intro composition, settled in from the first paint */}
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end vitrine:contents">
          <div
            className={`vitrine:absolute vitrine:top-[max(6.5rem,13svh)] max-sm:vitrine:top-[9.5rem] ${left} max-sm:vitrine:right-5`}>
            <div data-vitrine="intro" className="vitrine:relative vitrine:z-0 vitrine:animate-settle vitrine:[animation-delay:0.5s]">
              <h1
                id="hero-heading"
                className={`origin-bottom-right -rotate-2 ${display} text-[clamp(3rem,12vw,8.5rem)] vitrine:max-w-[5em] ${headlineSize}`}>
                {opening.headline}
              </h1>
              <BrushUnderline className="mt-3 h-5 w-[70%] -rotate-2 max-sm:vitrine:mt-1 max-sm:vitrine:h-3" />
            </div>
          </div>
          <p
            data-vitrine="intro"
            className={`${display} text-[clamp(1.5rem,3vw,3rem)] md:text-right vitrine:absolute vitrine:z-20 vitrine:m-0 ${bottom} ${right} vitrine:max-w-[44vw] vitrine:text-right vitrine:animate-settle vitrine:[animation-delay:0.8s] max-sm:vitrine:max-w-[72vw]`}>
            {opening.oppositeCorner}
          </p>
        </div>

        {/* Facão: the split headline sits around the object, one line behind it and one in front */}
        <div className="mt-16 grid items-center gap-8 md:grid-cols-[1fr_auto_1fr] vitrine:contents">
          <p
            data-vitrine="opened"
            className={`${splitLine} md:text-right vitrine:absolute vitrine:z-0 ${top} ${left} ${headlineWidth} vitrine:-rotate-2 vitrine:text-left ${headlineSize} ${waiting}`}>
            {opened.headline[0]}
          </p>
          <HeroPoster />
          <p
            data-vitrine="opened"
            className={`${splitLine} vitrine:absolute vitrine:z-20 ${bottom} ${right} ${headlineWidth} vitrine:-rotate-2 vitrine:text-right ${headlineSize} ${waiting}`}>
            {opened.headline[1]}
          </p>
        </div>

        {/* Selos: the badges drift up from below the frame */}
        <ul className="mt-10 flex flex-wrap justify-center gap-4 vitrine:pointer-events-none vitrine:absolute vitrine:inset-0 vitrine:m-0 vitrine:block">
          {opened.badges.map((badge, i) => (
            <li
              key={badge}
              data-vitrine="badge"
              className={`${badgeTilt[i]} rounded-board bg-casca px-5 py-3 font-semibold text-fibra shadow-board-sm vitrine:absolute vitrine:top-full vitrine:grid vitrine:size-36 vitrine:place-items-center vitrine:rounded-full vitrine:p-3 vitrine:text-center vitrine:text-[15px] vitrine:leading-tight vitrine:font-bold max-sm:vitrine:size-26 max-sm:vitrine:p-1.5 max-sm:vitrine:text-xs ${badgePlace[i]}`}>
              {badge}
            </li>
          ))}
        </ul>

        {/* Virar lata: the meter labels stay readable here; the Vitrine paints its own meter */}
        <ol className="mx-auto mt-14 flex max-w-xl flex-wrap justify-between gap-3 rounded-board-alt border-3 border-fibra bg-isopor p-4 text-sm font-semibold sm:text-base vitrine:sr-only">
          {transformation.meterLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ol>
        <PaintedMeter />

        {/* Lata gira: a headline behind the can, the body and the can's name in front of it */}
        <div className="mt-16 grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end vitrine:contents">
          <p
            data-vitrine="closing"
            className={`${splitLine} vitrine:absolute vitrine:z-0 ${top} ${left} vitrine:max-w-[min(60vw,6em)] vitrine:-rotate-2 max-sm:vitrine:right-5 max-sm:vitrine:max-w-none ${headlineSize} ${waiting}`}>
            {rotatingCan.headline}
          </p>
          <div
            data-vitrine="closing"
            className={`space-y-2 md:text-right vitrine:absolute vitrine:z-20 ${bottom} ${right} vitrine:max-w-72 vitrine:text-right max-sm:vitrine:max-w-[60vw] ${waiting}`}>
            <p className="text-lg max-sm:vitrine:text-sm max-sm:vitrine:leading-snug">{rotatingCan.corner}</p>
            <p className="text-sm text-fibra/80 max-sm:vitrine:text-xs">{rotatingCan.smallLine}</p>
          </div>
        </div>

        {/* Saída: the statement's hand-cut edge rises and wipes this frame away (lib/hero-copy.ts) */}
      </div>
    </section>
  );
}

/**
 * The Vitrine's 000 → 100 meter, counting through the meter labels as the coconut
 * becomes the can. Decorative: the labels are read from the list above, and the
 * changing count is never exposed.
 */
function PaintedMeter() {
  return (
    <div
      aria-hidden="true"
      data-vitrine="meter"
      className={`hidden rounded-board-alt border-3 border-fibra bg-isopor px-4 py-3 shadow-board-sm vitrine:absolute vitrine:z-20 vitrine:block vitrine:bottom-[8svh] ${left} vitrine:w-72 max-sm:vitrine:right-5 max-sm:vitrine:bottom-[9svh] max-sm:vitrine:w-auto max-sm:vitrine:px-3 max-sm:vitrine:py-2 ${waiting}`}>
      <div className="flex items-baseline justify-between gap-4 font-display text-sm uppercase">
        <span data-meter-label>{transformation.meterLabels[0]}</span>
        <span data-meter-count className="text-lg tabular-nums">
          {transformation.counter.from}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-polpa">
        <div data-meter-bar className="h-full origin-left rounded-full bg-fibra [transform:scaleX(0)]" />
      </div>
    </div>
  );
}

/**
 * The poster is the scripted render of the first 3D frame (assets/hero/build_hero.py).
 * Outside Static the live scene replaces it in the same box, so nothing shifts.
 */
function HeroPoster() {
  return (
    <HeroStage>
      <Image src={poster} alt="" loading="eager" sizes="(min-width: 80rem) 32rem, (min-width: 24rem) 24rem, 100vw" className="size-full" />
    </HeroStage>
  );
}
