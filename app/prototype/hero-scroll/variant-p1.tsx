"use client";

// PROTOTYPE phone variant P1, "Estreita": the Vitrine timeline kept beat for beat, squeezed into a
// portrait phone. The object shrinks to about 60% of the width so the badges can still drift past
// its edges (the middle one behind), the split headline goes above and below the object instead of
// into opposite corners, and the scroll drops from 7 to 6 screens. Judge at phone width (see /phone).
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "./gsap";
import { Hud } from "./hud";
import { type Beat, createRig } from "./rig";
import { AfterHero, Badge, badgeLabels, HeroLayers, Stage } from "./ui";

export const name = "Estreita: tudo encolhe";

const beats: Beat[] = [
  { name: "Girar", from: 0, to: 20 },
  { name: "Facão", from: 20, to: 25 },
  { name: "Selos", from: 25, to: 56 },
  { name: "Fechar", from: 56, to: 62 },
  { name: "Virar lata", from: 62, to: 75 },
  { name: "Lata gira", from: 75, to: 92 },
  { name: "Saída", from: 92, to: 100 },
];

const meterLabels = ["Coco inteiro", "Chacoalhando", "Na lata"];

function phoneRig() {
  const r = createRig();
  r.coconut.scale = 0.55;
  r.coconut.y = -0.1;
  r.can.y = -0.1;
  return r;
}

export function VariantP1() {
  const root = useRef<HTMLElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const [rig] = useState(phoneRig);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const r = rig;
      const count = root.current!.querySelector(".p1-count")!;
      const label = root.current!.querySelector(".p1-label")!;
      const bar = root.current!.querySelector<HTMLElement>(".p1-bar")!;
      const meter = { v: 0 };

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(r.coconut, { y: -2.6, scale: 0.3, rotZ: -0.3, duration: 2 })
        .from(".p1-intro", { y: 30, opacity: 0, stagger: 0.15, duration: 1.4 }, 0.5);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "+=600%", pin: true, scrub: 1.2 },
      });
      timeline.current = tl;

      tl.to(r.coconut, { rotY: 0.5 + Math.PI * 1.25, rotX: 0.12, duration: 20, ease: "sine.inOut" }, 0)
        .to(".p1-intro", { y: -40, opacity: 0, stagger: 1, duration: 6 }, 8)
        .to(r.coconut, { rotX: 0.45, duration: 4, ease: "power2.out" }, 19)
        .to(r.cap, { lift: 1, duration: 3, ease: "expo.out" }, 21)
        .fromTo(".p1-h2", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 5, stagger: 1.5, ease: "power2.out" }, 22)
        // Selos: same drift as desktop, but the badges overlap the coconut's edges.
        .fromTo(".p1-badge", { y: 0 }, { y: "-140svh", duration: 22, stagger: 4 }, 26)
        .to(".p1-badge", { rotate: (i) => [-14, 8, 18][i], duration: 22, stagger: 4 }, 26)
        .to(".p1-h2", { y: -40, opacity: 0, duration: 6, stagger: 1 }, 46)
        .to(r.cap, { lift: 0, duration: 6, ease: "power2.inOut" }, 56)
        .to(r.coconut, { rotX: 0, duration: 6, ease: "power2.inOut" }, 56)
        .fromTo(".p1-meter", { opacity: 0 }, { opacity: 1, duration: 2 }, 59)
        .to(
          meter,
          {
            v: 100,
            duration: 14,
            onUpdate: () => {
              count.textContent = String(Math.round(meter.v)).padStart(3, "0");
              label.textContent = meterLabels[meter.v < 20 ? 0 : meter.v < 99 ? 1 : 2];
              bar.style.width = `${meter.v}%`;
            },
          },
          60,
        )
        .to(r, { shake: 1, duration: 5, ease: "power1.in" }, 62)
        .to(r.coconut, { rotY: `+=${Math.PI * 2}`, duration: 6, ease: "power2.in" }, 63)
        .to(r, { burst: 1, duration: 8 }, 66)
        .to(r, { shake: 0, duration: 1 }, 68)
        .to(r.coconut, { scale: 0, duration: 1 }, 68)
        .fromTo(r.can, { scale: 0, rotY: -Math.PI * 2 }, { scale: 0.62, rotY: 0, duration: 6, ease: "power3.out" }, 68.5)
        .to(".p1-meter", { opacity: 0, duration: 2 }, 78)
        .fromTo(".p1-h3", { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 5, ease: "power2.out" }, 74)
        .to(r.can, { rotY: Math.PI, duration: 16, ease: "sine.inOut" }, 76)
        .fromTo(".p1-body3", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 4 }, 80)
        .fromTo(".dark-panel", { yPercent: 100 }, { yPercent: 0, duration: 8, ease: "power2.inOut" }, 92)
        .set({}, {}, 100);
    }, root);
    return () => ctx.revert();
  }, [rig]);

  return (
    <main>
      <HeroLayers
        sectionRef={root}
        back={
          <>
            <h1 className="p1-intro absolute top-[7svh] left-5 -rotate-2 font-display text-[17vw] leading-[0.9] tracking-[-0.02em]">
              Só o coco.
              <svg viewBox="0 0 300 20" className="mt-1 h-3 w-[60%] text-letreiro" aria-hidden>
                <path d="M2 14 C 80 4, 200 2, 298 10" stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none" />
              </svg>
            </h1>
            <h2 className="p1-h2 absolute top-[8svh] left-5 -rotate-1 font-display text-[15vw] leading-[0.9] tracking-[-0.02em] opacity-0">
              Coco, gelo
            </h2>
            <Badge small className="p1-badge top-full left-[37vw]">
              {badgeLabels[1]}
            </Badge>
            <h2 className="p1-h3 absolute top-[9svh] left-5 -rotate-2 font-display text-[17vw] leading-[0.9] tracking-[-0.02em] opacity-0">
              Gelado.
            </h2>
          </>
        }
        stage={<Stage rig={rig} crack="cap" />}
        front={
          <>
            <ul className="p1-intro absolute bottom-[9svh] left-5 max-w-[40vw] space-y-0.5 text-[13px] font-semibold">
              <li>• água de coco, polpa e gás</li>
              <li>• mais nada</li>
            </ul>
            <p className="p1-intro absolute right-5 bottom-[9svh] max-w-[46vw] text-right text-[13px] leading-snug">
              Um coco verde, aberto no facão e posto na lata. Pode abrir.
            </p>
            <h2 className="p1-h2 absolute right-5 bottom-[10svh] rotate-1 text-right font-display text-[11.5vw] leading-[0.9] tracking-[-0.02em] opacity-0">
              e paciência.
            </h2>
            <Badge small className="p1-badge top-full left-[3vw]">
              {badgeLabels[0]}
            </Badge>
            <Badge small className="p1-badge top-full right-[3vw]">
              {badgeLabels[2]}
            </Badge>
            <div className="p1-meter absolute right-5 bottom-[9svh] left-5 opacity-0">
              <div className="flex justify-between font-display text-xs uppercase">
                <span className="p1-label">{meterLabels[0]}</span>
                <span className="p1-count tabular-nums">000</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-isopor">
                <div className="p1-bar h-full w-0 rounded-full bg-fibra" />
              </div>
            </div>
            <p className="p1-body3 absolute right-5 bottom-[9svh] max-w-[60vw] text-right text-[14px] leading-snug opacity-0">
              Seis sabores, todos com o coco na frente. A fruta vem de acompanhante.
            </p>
          </>
        }
      />
      <AfterHero />
      <Hud beats={beats} total={100} timeline={timeline} rig={rig} />
    </main>
  );
}
