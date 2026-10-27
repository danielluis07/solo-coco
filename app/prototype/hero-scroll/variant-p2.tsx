"use client";

// PROTOTYPE phone variant P2, "Balcão": the object sits low, like goods on a kiosk counter, and the
// top half of the screen is a sign board that owns all the text. Nothing splits across the layers:
// headlines stay above the object, and the badges hang in the board one at a time instead of
// drifting past it. Fechar folds into Virar lata, and the scroll drops to 5 screens.
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "./gsap";
import { Hud } from "./hud";
import { type Beat, createRig } from "./rig";
import { AfterHero, Badge, badgeLabels, HeroLayers, Stage } from "./ui";

export const name = "Balcão: objeto embaixo";

const beats: Beat[] = [
  { name: "Girar", from: 0, to: 18 },
  { name: "Facão", from: 18, to: 23 },
  { name: "Selos", from: 23, to: 48 },
  { name: "Fechar + Virar lata", from: 48, to: 68 },
  { name: "Lata gira", from: 68, to: 90 },
  { name: "Saída", from: 90, to: 100 },
];

const meterLabels = ["Coco inteiro", "Chacoalhando", "Na lata"];

function phoneRig() {
  const r = createRig();
  r.coconut.scale = 0.62;
  r.coconut.y = -0.8;
  r.can.y = -0.55;
  return r;
}

export function VariantP2() {
  const root = useRef<HTMLElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const [rig] = useState(phoneRig);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const r = rig;
      const count = root.current!.querySelector(".p2-count")!;
      const label = root.current!.querySelector(".p2-label")!;
      const bar = root.current!.querySelector<HTMLElement>(".p2-bar")!;
      const meter = { v: 0 };

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(r.coconut, { y: -3, scale: 0.3, rotZ: -0.3, duration: 2 })
        .from(".p2-intro", { y: 30, opacity: 0, stagger: 0.15, duration: 1.4 }, 0.5);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "+=500%", pin: true, scrub: 1.2 },
      });
      timeline.current = tl;

      tl.to(r.coconut, { rotY: 0.5 + Math.PI * 1.25, rotX: 0.12, duration: 18, ease: "sine.inOut" }, 0)
        .to(".p2-intro", { y: -30, opacity: 0, stagger: 1, duration: 5 }, 7)
        // Facão: the cap has further to go from down here, so it lifts higher to leave the frame.
        .to(r.coconut, { rotX: 0.45, duration: 4, ease: "power2.out" }, 17)
        .to(r.cap, { lift: 2.1, duration: 3, ease: "expo.out" }, 19)
        .fromTo(".p2-h2", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 4, ease: "power2.out" }, 20)
        // Selos: each badge swings into the board from the right, hangs, and leaves left.
        .to(".p2-h2", { y: -30, opacity: 0, duration: 3 }, 25);
      [0, 1, 2].forEach((i) => {
        const at = 27 + i * 7;
        tl.fromTo(
          `.p2-badge-${i}`,
          { x: "70vw", rotate: 12 },
          { x: 0, rotate: [-4, 3, -2][i], duration: 3, ease: "power2.out" },
          at,
        ).to(`.p2-badge-${i}`, { x: "-80vw", rotate: -10, duration: 3, ease: "power2.in" }, at + 5);
      });
      // Fechar + Virar lata: the cap drops while the shake starts.
      tl.to(r.cap, { lift: 0, duration: 4, ease: "power2.inOut" }, 48)
        .to(r.coconut, { rotX: 0, duration: 4, ease: "power2.inOut" }, 48)
        .fromTo(".p2-meter", { opacity: 0 }, { opacity: 1, duration: 2 }, 48)
        .to(
          meter,
          {
            v: 100,
            duration: 16,
            onUpdate: () => {
              count.textContent = String(Math.round(meter.v)).padStart(3, "0");
              label.textContent = meterLabels[meter.v < 20 ? 0 : meter.v < 99 ? 1 : 2];
              bar.style.width = `${meter.v}%`;
            },
          },
          49,
        )
        .to(r, { shake: 1, duration: 5, ease: "power1.in" }, 51)
        .to(r.coconut, { rotY: `+=${Math.PI * 2}`, duration: 6, ease: "power2.in" }, 53)
        .to(r, { burst: 1, duration: 8 }, 56)
        .to(r, { shake: 0, duration: 1 }, 58)
        .to(r.coconut, { scale: 0, duration: 1 }, 58)
        .fromTo(r.can, { scale: 0, rotY: -Math.PI * 2 }, { scale: 0.72, rotY: 0, duration: 6, ease: "power3.out" }, 58.5)
        .to(".p2-meter", { opacity: 0, duration: 2 }, 66)
        .fromTo(".p2-h3", { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 4, ease: "power2.out" }, 68)
        .to(r.can, { rotY: Math.PI, duration: 18, ease: "sine.inOut" }, 70)
        .fromTo(".p2-body3", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 4 }, 73)
        .fromTo(".dark-panel", { yPercent: 100 }, { yPercent: 0, duration: 10, ease: "power2.inOut" }, 90)
        .set({}, {}, 100);
    }, root);
    return () => ctx.revert();
  }, [rig]);

  const board = "absolute inset-x-5 top-[7svh]";

  return (
    <main>
      <HeroLayers
        sectionRef={root}
        back={null}
        stage={<Stage rig={rig} crack="cap" />}
        front={
          <>
            <div className={`p2-intro ${board}`}>
              <h1 className="-rotate-2 font-display text-[18vw] leading-[0.9] tracking-[-0.02em]">Só o coco.</h1>
              <svg viewBox="0 0 300 20" className="mt-1 h-3 w-[55%] text-letreiro" aria-hidden>
                <path d="M2 14 C 80 4, 200 2, 298 10" stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <p className={`p2-intro absolute inset-x-5 top-[31svh] max-w-[80vw] text-[15px] leading-snug`}>
              Um coco verde, aberto no facão e posto na lata. Água de coco, polpa e gás. Mais nada.
            </p>
            <h2 className={`p2-h2 ${board} -rotate-1 font-display text-[15vw] leading-[0.9] tracking-[-0.02em] opacity-0`}>
              Coco, gelo e paciência.
            </h2>
            {[0, 1, 2].map((i) => (
              <Badge key={i} className={`p2-badge-${i} top-[13svh] left-[calc(50%-4.5rem)]`}>
                {badgeLabels[i]}
              </Badge>
            ))}
            <div className={`p2-meter ${board} top-[34svh] opacity-0`}>
              <div className="flex justify-between font-display text-sm uppercase">
                <span className="p2-label">{meterLabels[0]}</span>
                <span className="p2-count tabular-nums">000</span>
              </div>
              <div className="mt-1 h-2.5 rounded-full bg-isopor">
                <div className="p2-bar h-full w-0 rounded-full bg-fibra" />
              </div>
            </div>
            <h2 className={`p2-h3 ${board} -rotate-2 font-display text-[18vw] leading-[0.9] tracking-[-0.02em] opacity-0`}>
              Gelado.
            </h2>
            <p className="p2-body3 absolute inset-x-5 top-[22svh] max-w-[75vw] text-[15px] leading-snug opacity-0">
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
