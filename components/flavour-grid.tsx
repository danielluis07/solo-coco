import type { CSSProperties } from "react";
import {
  anchors,
  brand,
  copy,
  defaultPack,
  flavours,
  flavourStats,
  packLabel,
  type Flavour,
} from "@/content/page";
import { FlavourCan } from "./flavour-can";

const { grid } = copy;

const inkClass: Record<Flavour["ink"], string> = {
  fibra: "text-fibra",
  polpa: "text-polpa",
};

// Resting tilts in reading order: small and deliberately irregular.
const tilts = ["-1deg", "0.6deg", "-0.4deg", "1.1deg", "-0.8deg", "0.3deg"];

export function FlavourGrid() {
  return (
    <section
      id={anchors.grid}
      aria-labelledby="grid-heading"
      className="mx-auto w-full max-w-6xl scroll-mt-4 px-4 py-20 sm:px-8">
      <h2 id="grid-heading" className="font-display text-[clamp(2.25rem,7vw,3.5rem)] leading-[0.95]">
        {grid.heading}
      </h2>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="text-lg">{grid.intro}</p>
        <p className="rounded-board-alt bg-isopor px-3 py-1 text-sm font-semibold">{grid.disclosure}</p>
      </div>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {flavours.map((flavour, i) => (
          <li key={flavour.slug}>
            <FlavourCard flavour={flavour} tilt={tilts[i % tilts.length]} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * A painted price sign. Rests on a small tilt and settles to 0° on hover or
 * focus within; under reduced motion it stays untilted with no transitions.
 */
function FlavourCard({ flavour, tilt }: { flavour: Flavour; tilt: string }) {
  const headingId = `flavour-${flavour.slug}`;
  return (
    <article
      aria-labelledby={headingId}
      data-flavour={flavour.slug}
      style={{ backgroundColor: flavour.accent, "--tilt": tilt } as CSSProperties}
      className={`${inkClass[flavour.ink]} flex h-full flex-col rounded-board p-6 shadow-board motion-safe:rotate-(--tilt) motion-safe:transition-[rotate] motion-safe:duration-240 motion-safe:ease-out motion-safe:hover:rotate-0 motion-safe:focus-within:rotate-0`}>
      <FlavourCan slug={flavour.slug} />
      <h3 id={headingId} className="mt-5 font-display leading-[0.95]">
        <span className="block font-sans text-sm font-bold tracking-wide uppercase">{brand}</span>{" "}
        <span className="block text-3xl">{flavour.name}</span>
      </h3>
      <p className="mt-2 leading-snug">{flavour.descriptor}</p>
      <p className="mt-4 text-sm font-semibold tabular-nums">{flavourStats(flavour)}</p>
      <p className="text-sm">{grid.perCan}</p>
      <p className="mt-auto pt-5 font-display text-xl tabular-nums">{packLabel(defaultPack)}</p>
    </article>
  );
}
