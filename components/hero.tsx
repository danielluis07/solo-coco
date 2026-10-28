import Image from "next/image";
import { copy } from "@/content/page";
import poster from "@/public/hero/poster.png";
import { BrushUnderline } from "./brand";
import { HeroStage } from "./hero-stage";

const { opening, opened, transformation, rotatingCan } = copy.hero;

// Small, irregular tilts so the badges never read as a regular grid.
const badgeTilt = ["-rotate-2", "rotate-[1.5deg]", "-rotate-1"];

const splitLine = "font-display text-[clamp(2.25rem,7vw,4.5rem)] leading-[0.95] tracking-[-0.02em]";

/**
 * The Static Hero: the poster plus every Beat's Copy in normal page flow.
 * This markup is the accessible source of the Hero Copy in every tier.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="mx-auto w-full max-w-6xl px-4 pt-6 pb-20 sm:px-8">
      {/* Girar */}
      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <h1
            id="hero-heading"
            className="origin-bottom-right -rotate-2 font-display text-[clamp(3rem,12vw,8.5rem)] leading-[0.9] tracking-[-0.02em]">
            {opening.headline}
          </h1>
          <BrushUnderline className="mt-3 h-5 w-[70%] -rotate-2" />
        </div>
        <div className="space-y-3 text-lg md:text-right">
          <p>{opening.corner}</p>
          <p>{opening.oppositeCorner}</p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
        <a
          href={opening.cta.href}
          className="inline-flex min-h-11 items-center rounded-board bg-letreiro px-6 py-3 font-display text-xl text-polpa shadow-board">
          {opening.cta.label}
        </a>
        <p className="text-fibra/80">{opening.scrollCue}</p>
      </div>

      {/* Facão / Selos: the split headline sits around the poster; outside Static this row pins */}
      <div data-hero-pin className="mt-16 grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
        <p className={`${splitLine} md:text-right`}>{opened.headline[0]}</p>
        <HeroPoster />
        <p className={splitLine}>{opened.headline[1]}</p>
      </div>

      <ul className="mt-10 flex flex-wrap justify-center gap-4">
        {opened.badges.map((badge, i) => (
          <li
            key={badge}
            className={`${badgeTilt[i]} rounded-board bg-casca px-5 py-3 font-semibold text-fibra shadow-board-sm`}>
            {badge}
          </li>
        ))}
      </ul>

      {/* Virar lata: meter labels stay readable; the counter is decorative */}
      <ol className="mx-auto mt-14 flex max-w-xl flex-wrap justify-between gap-3 rounded-board-alt border-3 border-fibra bg-isopor p-4 text-sm font-semibold sm:text-base">
        {transformation.meterLabels.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ol>

      {/* Lata gira */}
      <div className="mt-16 grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
        <p className="font-display text-[clamp(2rem,6vw,4rem)] leading-[0.95] tracking-[-0.02em]">
          {rotatingCan.headline}
        </p>
        <div className="space-y-2 md:text-right">
          <p className="text-lg">{rotatingCan.corner}</p>
          <p className="text-sm text-fibra/80">{rotatingCan.smallLine}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * The poster is the scripted render of the first 3D frame (assets/hero/build_hero.py).
 * Outside Static the live scene replaces it in the same box, so nothing shifts.
 */
function HeroPoster() {
  return (
    <HeroStage>
      <Image src={poster} alt="" loading="eager" sizes="(min-width: 24rem) 24rem, 100vw" className="size-full" />
    </HeroStage>
  );
}
