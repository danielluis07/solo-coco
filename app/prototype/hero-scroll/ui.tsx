"use client";

// PROTOTYPE: shared Letreiro bits for the hero variants. Copy is provisional (the Copy ticket owns it).
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

export const Stage = dynamic(() => import("./stage"), { ssr: false });

const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .23 0 0 0 0 .16 0 0 0 0 .11 0 0 0 .09 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Grain() {
  return <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: grain }} />;
}

/**
 * The pinned hero: a back text layer, the 3D canvas, a front text layer, and the dark panel that
 * rises over the can at the end. Text in `back` passes behind the object; text in `front` over it.
 */
export function HeroLayers({
  back,
  stage,
  front,
  sectionRef,
}: {
  back: ReactNode;
  stage: ReactNode;
  front: ReactNode;
  sectionRef: React.Ref<HTMLElement>;
}) {
  return (
    <section ref={sectionRef} className="relative h-svh overflow-hidden bg-polpa">
      <Grain />
      <div className="absolute inset-0 z-0">{back}</div>
      <div className="pointer-events-none absolute inset-0 z-10">{stage}</div>
      <div className="pointer-events-none absolute inset-0 z-20">{front}</div>
      <DarkPanel />
    </section>
  );
}

export function Badge({
  children,
  className = "",
  anchor,
  small,
}: {
  children: ReactNode;
  className?: string;
  anchor?: number;
  /** Phone size. */
  small?: boolean;
}) {
  return (
    <div
      data-anchor={anchor}
      className={`absolute grid place-items-center rounded-full bg-casca text-center font-display leading-tight text-fibra shadow-[3px_4px_0_var(--color-fibra)] ${small ? "size-26 p-3 text-[13px]" : "size-36 p-5 text-base"} ${className}`}>
      {children}
    </div>
  );
}

export const badgeLabels = ["Só 3 ingredientes", "Levemente gaseificado", "Estupidamente gelado"];

function Statement() {
  return (
    <p className="max-w-4xl text-center font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.02em] text-polpa">
      Coco, gelo e{" "}
      <span className="inline-block -rotate-1 rounded-[18px_10px_16px_8px] bg-letreiro px-4">paciência.</span>
    </p>
  );
}

/** Slides up over the can as the hero's last beat; the page below continues in the same Fibra. */
function DarkPanel() {
  return (
    <div
      className="dark-panel absolute inset-0 z-30 grid translate-y-full place-items-center bg-fibra px-6"
      style={{ clipPath: "polygon(0 2%, 22% 0, 51% 1.5%, 78% 0, 100% 1.8%, 100% 100%, 0 100%)" }}>
      <div className="absolute inset-0 opacity-60">
        <Grain />
      </div>
      <Statement />
    </div>
  );
}

const flavours = [
  ["Só o Coco", "#7BA23F"],
  ["Maracujá", "#F2B628"],
  ["Caju", "#E8662A"],
  ["Açaí", "#5B2A6E"],
  ["Limão", "#B5CC3A"],
  ["Goiaba", "#EE8FA0"],
];

export function AfterHero() {
  return (
    <>
      <section className="relative grid min-h-svh place-items-center bg-fibra px-6">
        <Statement />
      </section>
      <section className="relative bg-polpa px-6 py-24">
        <Grain />
        <h2 className="relative mb-12 font-display text-6xl tracking-[-0.02em]">Os sabores</h2>
        <div className="relative grid grid-cols-2 gap-6 md:grid-cols-3">
          {flavours.map(([name, accent], i) => (
            <div
              key={name}
              className="grid aspect-[4/5] place-items-end rounded-[18px_10px_16px_8px] p-5 font-display text-2xl shadow-[3px_4px_0_var(--color-fibra)]"
              style={{ background: accent, rotate: `${[-1, 0.6, -0.4, 1.2, -0.8, 0.3][i]}deg`, color: name === "Açaí" ? "#FAFAF5" : "#3A2A1D" }}>
              {name}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
