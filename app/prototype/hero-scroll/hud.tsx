"use client";

// PROTOTYPE: debug HUD. Shows where the timeline is, which beat is playing, and the rig values.
// Toggle with "h". Never ships.
import { useEffect, useRef, useState } from "react";
import type { gsap } from "./gsap";
import type { Beat, Rig } from "./rig";

type Props = {
  beats: Beat[];
  total: number;
  timeline: React.RefObject<gsap.core.Timeline | null>;
  rig: Rig;
  /** Extra line, e.g. the current chapter. */
  extra?: () => string;
};

const f = (n: number) => n.toFixed(2).padStart(5);

export function Hud({ beats, total, timeline, rig, extra }: Props) {
  // null: the default, open on desktop and hidden at phone width where it would cover the hero.
  const [open, setOpen] = useState<boolean | null>(null);
  const text = useRef<HTMLPreElement>(null);
  const marker = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "h") setOpen((o) => !(o ?? window.innerWidth >= 640));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const tl = timeline.current;
      const t = tl?.time() ?? 0;
      const beat = beats.find((b) => t >= b.from && t < b.to) ?? beats[beats.length - 1];
      const scroll = tl?.scrollTrigger?.progress;
      if (marker.current) marker.current.style.left = `${(t / total) * 100}%`;
      if (text.current) {
        const { coconut: c, can, cam } = rig;
        text.current.textContent = [
          `t ${t.toFixed(1).padStart(5)} / ${total}${scroll === undefined ? "" : `   scroll ${(scroll * 100).toFixed(0)}%`}`,
          `beat  ${beat.name}`,
          extra?.() ?? "",
          `coco  y${f(c.y)} s${f(c.scale)} rx${f(c.rotX)} ry${f(c.rotY)}`,
          `cut   lift${f(rig.cap.lift)} slide${f(rig.cap.slide)} split${f(rig.split)}`,
          `swap  shake${f(rig.shake)} burst${f(rig.burst)}`,
          `can   y${f(can.y)} s${f(can.scale)} ry${f(can.rotY)}`,
          `cam   r${f(cam.r)} az${f(cam.azim)} el${f(cam.elev)}`,
        ]
          .filter(Boolean)
          .join("\n");
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [beats, total, timeline, rig, extra]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-black/85 p-3 font-mono text-[11px] text-white ring-2 ring-fuchsia-500 ${open === null ? "max-sm:hidden" : open ? "" : "hidden"}`}>
      <div className="relative mb-2 flex h-6 overflow-hidden rounded">
        {beats.map((b, i) => (
          <div
            key={b.name}
            title={b.name}
            className={`flex items-center justify-center truncate border-r border-black px-0.5 text-[9px] ${i % 2 ? "bg-fuchsia-900" : "bg-fuchsia-700"}`}
            style={{ width: `${((b.to - b.from) / total) * 100}%` }}>
            {b.name}
          </div>
        ))}
        <div ref={marker} className="absolute top-0 h-full w-0.5 bg-white" />
      </div>
      <pre ref={text} className="whitespace-pre" />
      <p className="mt-2 text-white/60">h hides this · ← → switch variant · copy is provisional</p>
    </div>
  );
}
