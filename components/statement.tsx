"use client";

import { useLayoutEffect, useRef } from "react";
import { anchors, copy } from "@/content/page";
import type { StatementSequence } from "@/lib/statement-sequence";
import { useMotion } from "./motion-provider";

const { statement } = copy;

const plaqueTilt = ["-rotate-1", "rotate-[0.6deg]", "-rotate-[1.4deg]"];

const plaqueType = "font-display text-[clamp(1.75rem,6vw,3.5rem)] leading-[1.15] text-polpa";

/**
 * The dark brand statement. Static shows all three plaque phrases in flow;
 * outside Static it pins while one plaque cycles them. The in-flow phrases
 * stay the accessible source in every tier.
 */
export function Statement() {
  const { motion } = useMotion();
  const animated = motion !== null && motion.tier !== "static";
  const pinned = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLSpanElement>(null);

  // A layout effect, so entering Static releases the pin before the
  // controller puts the visible content and focus back.
  useLayoutEffect(() => {
    if (!animated) return;
    let cancelled = false;
    let sequence: StatementSequence | null = null;
    import("@/lib/statement-sequence").then(({ startStatementSequence }) => {
      if (cancelled || !pinned.current || !track.current) return;
      sequence = startStatementSequence({ pinned: pinned.current, track: track.current });
    });
    return () => {
      cancelled = true;
      sequence?.stop();
    };
  }, [animated]);

  return (
    <section
      id={anchors.statement}
      aria-labelledby="statement-heading"
      className="relative scroll-mt-4 bg-fibra bg-grain-dark text-polpa">
      <HandCutEdge />
      <div ref={pinned}>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
          <h2
            id="statement-heading"
            className="font-display text-[clamp(3.5rem,12vw,8rem)] leading-[0.9] tracking-[-0.02em]">
            {statement.headline}
          </h2>
          <ul className={animated ? "sr-only" : "mt-6 flex flex-wrap gap-4"}>
            {statement.plaque.map((phrase, i) => (
              <li key={phrase} className={`${plaqueTilt[i]} rounded-board bg-letreiro px-4 pb-1 ${plaqueType}`}>
                {phrase}
              </li>
            ))}
          </ul>
          {animated && (
            // One line tall: the track slides up behind it, one phrase at a time.
            <div
              aria-hidden="true"
              className={`${plaqueTilt[0]} mt-6 h-[calc(1.15em+--spacing(1))] w-fit overflow-hidden rounded-board bg-letreiro whitespace-nowrap ${plaqueType}`}>
              <span ref={track} className="flex flex-col">
                {statement.plaque.map((phrase) => (
                  <span key={phrase} className="px-4 pb-1">
                    {phrase}
                  </span>
                ))}
              </span>
            </div>
          )}
          <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-end">
            <p className="max-w-md text-lg leading-relaxed">{statement.body}</p>
            <div className="space-y-6 md:text-right">
              <p className="font-display text-2xl leading-tight">{statement.closing}</p>
              <a
                href={statement.link.href}
                className="inline-flex min-h-11 items-center rounded-board bg-letreiro px-5 py-2 font-bold text-polpa">
                {statement.link.label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The panel's uneven, hand-cut top edge. */
function HandCutEdge() {
  return (
    <svg
      viewBox="0 0 1200 24"
      preserveAspectRatio="none"
      className="absolute inset-x-0 -top-[23px] h-6 w-full fill-fibra"
      aria-hidden="true"
      focusable="false">
      <path d="M0 24 L0 14 L140 9 L310 16 L470 6 L640 13 L820 4 L990 12 L1200 7 L1200 24 Z" />
    </svg>
  );
}
