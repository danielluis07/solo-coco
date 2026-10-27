"use client";

// PROTOTYPE: pieces every style-tile variant reuses. Layout stays per variant.
import { useEffect, useState, useSyncExternalStore } from "react";
import { baseTokens, contrast, flavours, grade, packs, palette, rotatingWords } from "./tokens";

/** The machete-cut coconut top: a round husk with one angled notch showing the flesh. */
export function CocoSymbol({ className, husk = palette.casca }: { className?: string; husk?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <clipPath id="coco-cut">
          <polygon points="0,100 0,0 54,0 100,34 100,100" />
        </clipPath>
      </defs>
      <circle cx="50" cy="54" r="42" fill={husk} clipPath="url(#coco-cut)" />
      <path d="M56 13 L91 37 L88 44 L52 18 Z" fill={palette.polpa} stroke={palette.fibra} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="72" cy="28" rx="7" ry="3" transform="rotate(34 72 28)" fill={palette.isopor} />
    </svg>
  );
}

/** Stand-in for the hand-lettered wordmark: display face on a lifted, uneven baseline. */
export function Wordmark({ className, color = palette.fibra }: { className?: string; color?: string }) {
  const lift = [0, -0.03, -0.05, -0.06, -0.06, -0.05, -0.03, 0];
  const tilt = [-3, 1, -1, 2, -2, 1, -1, 3];
  return (
    <span className={className} style={{ color }} aria-label="SoloCoco">
      {"SoloCoco".split("").map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="inline-block"
          style={{ transform: `translateY(${lift[i]}em) rotate(${tilt[i]}deg)` }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (on) => {
      const mq = window.matchMedia(reducedMotionQuery);
      mq.addEventListener("change", on);
      return () => mq.removeEventListener("change", on);
    },
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

/** The brand-statement word: slides up slowly, holds long. Static under reduced motion. */
export function RotatingWord({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((n) => (n + 1) % rotatingWords.length), 2800);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <span className={`relative inline-block h-[1.1em] overflow-hidden align-bottom ${className ?? ""}`}>
      <span className="sr-only">{rotatingWords.join(", ")}</span>
      <span
        aria-hidden="true"
        className="flex flex-col transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ transform: `translateY(-${i * 1.1}em)` }}>
        {rotatingWords.map((w) => (
          <span key={w} className="block h-[1.1em] leading-[1.1em] whitespace-nowrap">
            {w}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Decorative pack picker state. Nothing is ever bought. */
export function useQuickAdd() {
  const [open, setOpen] = useState<string | null>(null);
  const [pack, setPack] = useState(0);
  const [added, setAdded] = useState<string | null>(null);
  return {
    open,
    pack,
    added,
    packs,
    toggle: (name: string) => {
      setOpen((o) => (o === name ? null : name));
      setAdded(null);
      setPack(0);
    },
    choose: setPack,
    confirm: (name: string) => {
      setAdded(name);
      setOpen(null);
    },
  };
}

export type QuickAdd = ReturnType<typeof useQuickAdd>;

/** Raw-data panel: every token and Flavour accent against Polpa and Fibra, with WCAG grades. */
export function ContrastSheet({ fontFamily }: { fontFamily: string }) {
  const rows = [
    ...baseTokens.map((t) => ({ name: t.name, hex: t.hex, role: t.role })),
    ...flavours.slice(1).map((f) => ({ name: f.name, hex: f.accent, role: "Flavour accent" })),
  ];
  return (
    <div style={{ fontFamily }} className="overflow-x-auto text-sm text-[#3A2A1D]">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#3A2A1D]/30">
            <th className="py-2 pr-3 font-semibold">Cor</th>
            <th className="py-2 pr-3 font-semibold">Texto sobre Polpa</th>
            <th className="py-2 pr-3 font-semibold">Texto sobre Fibra</th>
            <th className="py-2 font-semibold">Melhor tinta em cima</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const onPolpa = contrast(r.hex, palette.polpa);
            const onFibra = contrast(r.hex, palette.fibra);
            const ink = onPolpa > onFibra ? { n: "Polpa", v: onPolpa } : { n: "Fibra", v: onFibra };
            return (
              <tr key={r.name} className="border-b border-[#3A2A1D]/10">
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2">
                    <span className="size-5 shrink-0 rounded-full ring-1 ring-[#3A2A1D]/20" style={{ background: r.hex }} />
                    <span>
                      {r.name} <span className="text-[#3A2A1D]/60">{r.hex}</span>
                    </span>
                  </span>
                </td>
                <td className="py-2 pr-3 tabular-nums">
                  {onPolpa.toFixed(2)} <b>{grade(onPolpa)}</b>
                </td>
                <td className="py-2 pr-3 tabular-nums">
                  {onFibra.toFixed(2)} <b>{grade(onFibra)}</b>
                </td>
                <td className="py-2 tabular-nums">
                  {r.name === "Polpa" || r.name === "Fibra" ? "—" : `${ink.n}, ${ink.v.toFixed(2)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Painted-board grain: an SVG noise tile, used as a background image. */
export const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.23 0 0 0 0 0.16 0 0 0 0 0.11 0 0 0 0.09 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/** Brush grain stretched horizontally: reads as dry fibre or a painted stroke. */
export const fibre = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012 0.6' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.98 0 0 0 0 0.98 0 0 0 0 0.96 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`;

/** Condensation on a cold cooler lid. */
export const droplets =
  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 0 1.5px, rgba(58,42,29,0.10) 2.5px, transparent 3.5px), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.85) 0 1px, rgba(58,42,29,0.08) 2px, transparent 3px)";
