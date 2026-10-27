"use client";

// PROTOTYPE variant C, "Placas": scroll only picks the chapter. Each move plays in time, at its own
// unhurried pace, when you cross into a chapter, then everything holds while you read a painted
// board. The machete splits the coconut into two halves that open towards you like a book.
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { Hud } from "./hud";
import { type Beat, createRig } from "./rig";
import { AfterHero, Badge, badgeLabels, HeroLayers, Stage } from "./ui";

export const name = "Placas: capítulos";

const chapters = ["Chegada", "Facão", "Selos", "Lata", "Verso", "Saída"];
const labels = [0, 10, 20, 40, 50, 60];
/** Seconds of playback per timeline unit when a chapter change plays. */
const PACE = 0.16;

const beats: Beat[] = chapters.slice(1).map((name, i) => ({ name: `→ ${name}`, from: labels[i], to: labels[i + 1] }));

const board =
  "absolute max-w-md rounded-[18px_10px_16px_8px] bg-polpa p-6 shadow-[3px_4px_0_var(--color-fibra)] ring-2 ring-fibra";

export function VariantC() {
  const root = useRef<HTMLElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const chapter = useRef(0);
  const extra = useCallback(() => `chapter ${chapter.current} ${chapters[chapter.current]}`, []);
  const [rig] = useState(createRig);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const r = rig;

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(r.coconut, { y: -2.6, scale: 0.4, rotY: -1.4, duration: 2 })
        .from(".c-b1", { x: -60, opacity: 0, duration: 1.4 }, 0.6);

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });
      timeline.current = tl;

      // → Facão
      tl.to(".c-b1", { x: -60, opacity: 0, duration: 3 }, 0)
        .to(r.coconut, { rotY: 0, rotX: 0.15, duration: 3 }, 0)
        .to(r, { split: 1, duration: 3, ease: "expo.out" }, 3)
        .fromTo(".c-b2", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 4, ease: "power3.out" }, 6)
        // → Selos: plaques set down one at a time on the open halves.
        .fromTo(
          ".c-badge",
          { scale: 0.6, opacity: 0, rotate: -10 },
          { scale: 1, opacity: 1, rotate: (i) => [-6, 4, -2][i], duration: 4, stagger: 3, ease: "power3.out" },
          10,
        )
        // → Lata
        .to(".c-badge", { opacity: 0, scale: 0.8, duration: 3, stagger: 0.5 }, 20)
        .to(".c-b2", { x: 60, opacity: 0, duration: 3 }, 20)
        .to(r, { split: 0, duration: 5 }, 22)
        .to(r, { shake: 1, duration: 5, ease: "power1.in" }, 26)
        .to(r.coconut, { rotY: Math.PI * 2, rotX: 0, duration: 6, ease: "power2.in" }, 27)
        .to(r, { burst: 1, duration: 8, ease: "none" }, 30)
        .to(r, { shake: 0, duration: 1 }, 32)
        .to(r.coconut, { scale: 0, duration: 1, ease: "none" }, 33)
        .fromTo(r.can, { scale: 0, rotY: -Math.PI * 2 }, { scale: 0.85, rotY: 0, duration: 6, ease: "power3.out" }, 33.5)
        .fromTo(".c-b3", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 4, ease: "power3.out" }, 36)
        // → Verso
        .to(".c-b3", { x: -60, opacity: 0, duration: 3 }, 40)
        .to(r.can, { rotY: Math.PI, duration: 8, ease: "sine.inOut" }, 40)
        .fromTo(".c-b4", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 4, ease: "power3.out" }, 45)
        // → Saída
        .fromTo(".dark-panel", { yPercent: 100 }, { yPercent: 0, duration: 10 }, 50);

      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "+=500%",
        pin: true,
        onUpdate: (self) => {
          const next = Math.round(self.progress * (chapters.length - 1));
          if (next === chapter.current) return;
          chapter.current = next;
          const to = labels[next];
          tl.tweenTo(to, { duration: Math.abs(to - tl.time()) * PACE, ease: "none" });
        },
      });
    }, root);
    return () => ctx.revert();
  }, [rig]);

  return (
    <main>
      <HeroLayers
        sectionRef={root}
        back={
          <div className={`c-b1 ${board} top-[16vh] left-[6vw] -rotate-2`}>
            <h1 className="font-display text-[clamp(3.5rem,8vw,7rem)] leading-[0.9] tracking-[-0.02em]">Só o coco.</h1>
            <p className="mt-4">Um coco verde, aberto no facão e posto na lata. Levemente gaseificado.</p>
          </div>
        }
        stage={<Stage rig={rig} crack="halves" />}
        front={
          <>
            <div className={`c-b2 ${board} right-[6vw] bottom-[14vh] rotate-1 opacity-0`}>
              <h2 className="font-display text-5xl leading-[0.9] tracking-[-0.02em]">Coco, gelo e paciência.</h2>
            </div>
            <Badge className="c-badge top-[18vh] left-[22vw] opacity-0">{badgeLabels[0]}</Badge>
            <Badge className="c-badge top-[12vh] right-[24vw] opacity-0">{badgeLabels[1]}</Badge>
            <Badge className="c-badge bottom-[12vh] left-[38vw] opacity-0">{badgeLabels[2]}</Badge>
            <div className={`c-b3 ${board} top-[18vh] left-[6vw] -rotate-1 opacity-0`}>
              <h2 className="font-display text-6xl leading-[0.9] tracking-[-0.02em]">Na lata.</h2>
              <p className="mt-3">O mesmo coco. Agora cabe na geladeira.</p>
            </div>
            <div className={`c-b4 ${board} right-[6vw] bottom-[16vh] rotate-2 opacity-0`}>
              <p>Água de coco, polpa de coco e gás. Mais nada. 35 kcal, 3 g de açúcar.</p>
            </div>
          </>
        }
      />
      <AfterHero />
      <Hud beats={beats} total={60} timeline={timeline} rig={rig} extra={extra} />
    </main>
  );
}
