"use client";

// PROTOTYPE shell: one label system at a time, shown as the hero can, the grid renders
// and the flat UV strips. Switch systems with ?variant=A|B|C.
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import { Can, FlatStrip } from "./can";
import * as A from "./label-a";
import * as B from "./label-b";
import * as C from "./label-c";
import { flavours, palette, strip } from "./tokens";

const variants = [
  { key: "A", ...A },
  { key: "B", ...B },
  { key: "C", ...C },
];

const poses = [
  { name: "Frente", angle: 0 },
  { name: "Lado", angle: 90 },
  { name: "Verso", angle: 180 },
];

export function CanLabel() {
  const current = useSearchParams().get("variant") ?? "A";
  const v = variants.find((x) => x.key === current) ?? variants[0];
  const [pick, setPick] = useState(0);
  const [angle, setAngle] = useState(0);
  const [spin, setSpin] = useState(false);
  const [guides, setGuides] = useState(true);

  useEffect(() => {
    if (!spin || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      setAngle((a) => (a + (t - last) * 0.03) % 360);
      last = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spin]);

  const id = (i: number) => `strip-${v.key}-${i}`;
  const facing = ((0.25 + angle / 360) % 1).toFixed(2);

  return (
    <main style={{ fontFamily: "var(--font-figtree)" }} className="min-h-screen bg-[#FAFAF5] pb-28 text-[#3A2A1D]">
      {/* Every Flavour's strip, defined once and reused by every can and flat view. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          {flavours.map((f, i) => (
            <symbol key={i} id={id(i)} viewBox={`0 0 ${strip.w} ${strip.h}`}>
              <v.Label f={f} id={id(i)} />
            </symbol>
          ))}
        </defs>
      </svg>

      <header className="mx-auto max-w-6xl px-5 pt-8 sm:px-8">
        <p className="text-sm text-[#3A2A1D]/70">Prototype for “What does each Flavour’s can label look like?”</p>
        <h1 style={{ fontFamily: "var(--font-bowlby-one)" }} className="mt-2 text-4xl leading-none tracking-[-0.02em] sm:text-5xl">
          {v.key}. {v.name}
        </h1>
        <ul className="mt-4 max-w-3xl list-disc space-y-1 pl-5 leading-relaxed">
          {v.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </header>

      {/* Hero can */}
      <section className="mx-auto mt-10 grid max-w-6xl items-center gap-10 px-5 sm:px-8 md:grid-cols-[auto_1fr]">
        <div className="grid place-items-center rounded-[18px_10px_16px_8px] bg-[#FAFAF5] px-10 py-12 shadow-[inset_0_0_0_2px_#DCE6EA] sm:px-20">
          <Can stripId={id(pick)} width={240} angle={angle} />
        </div>
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold">Hero can</h2>
            <p className="text-sm text-[#3A2A1D]/70">The hero is always Só o Coco; the others are here to judge the system. Verso is the “Lata gira” pose.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {flavours.map((f, i) => (
              <button
                key={f.name}
                type="button"
                onClick={() => setPick(i)}
                style={{ background: f.accent, color: f.ink }}
                className={`rounded-[12px_6px_10px_5px] px-3 py-1.5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A2A1D] ${pick === i ? "shadow-[2px_3px_0_#3A2A1D] ring-2 ring-[#3A2A1D]" : "opacity-80"}`}>
                {f.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {poses.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setSpin(false);
                  setAngle(p.angle);
                }}
                className="rounded-full border-2 border-[#3A2A1D] px-3 py-1 text-sm font-semibold hover:bg-[#DCE6EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A2A1D]">
                {p.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSpin((s) => !s)}
              className="rounded-full border-2 border-[#3A2A1D] px-3 py-1 text-sm font-semibold hover:bg-[#DCE6EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A2A1D]">
              {spin ? "Parar" : "Girar"}
            </button>
          </div>
          <label className="block max-w-md">
            <span className="text-sm">Rotation</span>
            <input
              type="range"
              min={0}
              max={359}
              value={Math.round(angle)}
              onChange={(e) => {
                setSpin(false);
                setAngle(Number(e.target.value));
              }}
              className="mt-1 block w-full accent-[#4E7A1F]"
            />
          </label>
          <pre className="rounded-[10px_6px_8px_4px] bg-[#DCE6EA] p-3 text-xs leading-relaxed">
            {`variant  ${v.key} (${v.name})
flavour  ${flavours[pick].name}  accent ${flavours[pick].accent}  ink ${flavours[pick].ink}
angle    ${Math.round(angle)}°   facing u ${facing}
strip    ${strip.w} x ${strip.h}, seam on the left side (u 0)`}
          </pre>
        </div>
      </section>

      {/* Grid renders */}
      <section className="mx-auto mt-16 max-w-6xl px-5 sm:px-8">
        <h2 className="font-semibold">Grid renders</h2>
        <p className="text-sm text-[#3A2A1D]/70">The same can, front pose, on each card’s accent wash, at roughly card size.</p>
        <ul className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {flavours.map((f, i) => (
            <li
              key={f.name}
              style={{ background: f.accent, rotate: `${[-0.6, 0.4, -0.3, 0.5, -0.4, 0.3][i]}deg` }}
              className="grid place-items-center rounded-[18px_10px_16px_8px] px-4 pt-6 pb-4 shadow-[3px_4px_0_#3A2A1D]">
              <Can stripId={id(i)} width={92} angle={-12} faces={28} />
              <p style={{ fontFamily: "var(--font-bowlby-one)", color: f.ink }} className="mt-4 text-xl">
                {f.name}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Flat strips */}
      <section className="mx-auto mt-16 max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="font-semibold">Flat art for the UV strip</h2>
            <p className="text-sm text-[#3A2A1D]/70">
              {strip.w} x {strip.h}. Dashed boxes are the panels that read face-on. Grain is a page overlay here; in production it is baked into the texture.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} className="accent-[#4E7A1F]" />
            Show guides
          </label>
        </div>
        <ul className="mt-6 space-y-6">
          {flavours.map((f, i) => (
            <li key={f.name}>
              <p className="mb-2 text-sm font-semibold">{f.name}</p>
              <div className="overflow-hidden rounded-[10px_6px_8px_4px] ring-1 ring-[#3A2A1D]/20" style={{ background: palette.polpa }}>
                <FlatStrip stripId={id(i)} guides={guides} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <PrototypeSwitcher variants={variants} current={v.key} />
    </main>
  );
}
