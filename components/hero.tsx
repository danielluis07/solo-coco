import Image from "next/image";
import { copy } from "@/content/page";
import poster from "@/public/hero/poster.png";
import { BrushUnderline } from "./brand";
import { HeroStage } from "./hero-stage";

const { opening, opened, transformation, rotatingCan } = copy.hero;

// Small, irregular tilts so the badges never read as a regular grid.
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

const splitLine = `${display} text-[clamp(2.25rem,7vw,4.5rem)] leading-[0.95]`;

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
 * of the Hero Copy; only the painted meter and the Saída panel are decoration.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto w-full max-w-6xl px-4 pt-6 pb-20 sm:px-8 vitrine:max-w-none vitrine:p-0">
      <div data-hero-pin className="vitrine:relative vitrine:isolate vitrine:h-svh vitrine:overflow-hidden">
        {/* Girar: the intro composition, settled in from the first paint */}
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end vitrine:contents">
          <div
            className={`vitrine:absolute vitrine:top-[max(6.5rem,13svh)] max-sm:vitrine:top-[9.5rem] ${left} max-sm:vitrine:right-5`}>
            <div data-vitrine="intro" className="vitrine:relative vitrine:z-0 vitrine:animate-settle vitrine:[animation-delay:0.5s]">
              <h1
                id="hero-heading"
                className={`origin-bottom-right -rotate-2 ${display} text-[clamp(3rem,12vw,8.5rem)] vitrine:max-w-[5em] vitrine:text-[clamp(3.5rem,min(10vw,17svh),9rem)] max-sm:vitrine:text-[17vw]`}>
                {opening.headline}
              </h1>
              <BrushUnderline className="mt-3 h-5 w-[70%] -rotate-2 max-sm:vitrine:mt-1 max-sm:vitrine:h-3" />
            </div>
            <div
              data-vitrine="intro"
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 vitrine:relative vitrine:z-20 vitrine:mt-6 vitrine:flex-col vitrine:items-start vitrine:gap-y-3 vitrine:animate-settle vitrine:[animation-delay:0.65s] max-sm:vitrine:mt-4 max-sm:vitrine:gap-y-2 has-focus-visible:opacity-100!">
              <a
                href={opening.cta.href}
                className="inline-flex min-h-11 items-center rounded-board bg-letreiro px-6 py-3 font-display text-xl text-polpa shadow-board max-sm:vitrine:px-4 max-sm:vitrine:py-2 max-sm:vitrine:text-lg">
                {opening.cta.label}
              </a>
              <p className="text-fibra/80 max-sm:vitrine:text-[13px]">{opening.scrollCue}</p>
            </div>
          </div>
          <div className="space-y-3 text-lg md:text-right vitrine:contents">
            <p
              data-vitrine="intro"
              className={`vitrine:absolute vitrine:z-20 vitrine:m-0 ${bottom} ${left} vitrine:max-w-64 vitrine:animate-settle vitrine:[animation-delay:0.8s] max-sm:vitrine:max-w-[42vw] max-sm:vitrine:text-[13px] max-sm:vitrine:leading-snug`}>
              {opening.corner}
            </p>
            <p
              data-vitrine="intro"
              className={`vitrine:absolute vitrine:z-20 vitrine:m-0 ${bottom} ${right} vitrine:max-w-64 vitrine:text-right vitrine:animate-settle vitrine:[animation-delay:0.95s] max-sm:vitrine:max-w-[42vw] max-sm:vitrine:text-[13px] max-sm:vitrine:leading-snug`}>
              {opening.oppositeCorner}
            </p>
          </div>
        </div>

        {/* Facão: the split headline sits around the object, one line behind it and one in front */}
        <div className="mt-16 grid items-center gap-8 md:grid-cols-[1fr_auto_1fr] vitrine:contents">
          <p
            data-vitrine="opened"
            className={`${splitLine} md:text-right vitrine:absolute vitrine:z-0 ${top} ${left} vitrine:max-w-[5em] vitrine:-rotate-1 vitrine:text-left vitrine:text-[clamp(3rem,min(8vw,15svh),7.5rem)] max-sm:vitrine:text-[15vw] ${waiting}`}>
            {opened.headline[0]}
          </p>
          <HeroPoster />
          <p
            data-vitrine="opened"
            className={`${splitLine} vitrine:absolute vitrine:z-20 ${bottom} ${right} vitrine:rotate-1 vitrine:text-right vitrine:text-[clamp(3rem,min(8vw,15svh),7.5rem)] max-sm:vitrine:text-[15vw] ${waiting}`}>
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
            className={`${display} text-[clamp(2rem,6vw,4rem)] leading-[0.95] vitrine:absolute vitrine:z-0 ${top} ${left} vitrine:max-w-[min(44vw,9em)] vitrine:-rotate-2 vitrine:text-[clamp(2.5rem,min(6vw,11svh),5.5rem)] max-sm:vitrine:right-5 max-sm:vitrine:max-w-none max-sm:vitrine:text-[11.5vw] ${waiting}`}>
            {rotatingCan.headline}
          </p>
          <div
            data-vitrine="closing"
            className={`space-y-2 md:text-right vitrine:absolute vitrine:z-20 ${bottom} ${right} vitrine:max-w-72 vitrine:text-right max-sm:vitrine:max-w-[60vw] ${waiting}`}>
            <p className="text-lg max-sm:vitrine:text-sm max-sm:vitrine:leading-snug">{rotatingCan.corner}</p>
            <p className="text-sm text-fibra/80 max-sm:vitrine:text-xs">{rotatingCan.smallLine}</p>
          </div>
        </div>

        {/* Saída: the dark Fibra panel rises over the can; the brand statement runs on from it */}
        <div
          aria-hidden="true"
          data-vitrine="panel"
          className="hidden bg-fibra bg-grain-dark bg-bottom clip-hand-cut [transform:translateY(100%)] vitrine:absolute vitrine:inset-x-0 vitrine:-top-6 vitrine:bottom-0 vitrine:z-30 vitrine:block"
        />
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
