"use client";

// PROTOTYPE variant A, "Vitrine": the demo.mp4 rhythm. The camera never moves; the coconut and then
// the can stay centred while every beat is scrubbed continuously by scroll. The machete cut lifts
// the cap straight up and out of frame; badges drift past, the middle one behind the coconut.
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "./gsap";
import { Hud } from "./hud";
import { type Beat, createRig } from "./rig";
import { AfterHero, Badge, badgeLabels, HeroLayers, Stage } from "./ui";

export const name = "Vitrine: scrub contínuo";

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

export function VariantA() {
  const root = useRef<HTMLElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const [rig] = useState(createRig);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const r = rig;
      const count = root.current!.querySelector(".a-count")!;
      const label = root.current!.querySelector(".a-label")!;
      const bar = root.current!.querySelector<HTMLElement>(".a-bar")!;
      const meter = { v: 0 };

      // Entrance plays on load, in time; scroll takes over from a composed first frame.
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        // No rotY here: the scrubbed timeline owns rotY from scroll 0.
        .from(r.coconut, { y: -2.6, scale: 0.4, rotZ: -0.3, duration: 2 })
        .from(".a-intro", { y: 40, opacity: 0, stagger: 0.15, duration: 1.4 }, 0.5);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "+=700%", pin: true, scrub: 1.2 },
      });
      timeline.current = tl;

      tl.to(r.coconut, { rotY: 0.5 + Math.PI * 1.25, rotX: 0.12, duration: 20, ease: "sine.inOut" }, 0)
        .to(".a-intro", { y: -60, opacity: 0, stagger: 1, duration: 6 }, 8)
        // Facão: the one sharp beat.
        .to(r.coconut, { rotX: 0.45, duration: 4, ease: "power2.out" }, 19)
        .to(r.cap, { lift: 1, duration: 3, ease: "expo.out" }, 21)
        .fromTo(".a-h2", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 5, stagger: 1.5, ease: "power2.out" }, 22)
        // Selos: badges drift up past the open coconut at different speeds.
        .fromTo(".a-badge", { y: 0 }, { y: "-150vh", duration: 22, stagger: 4 }, 26)
        .to(".a-badge", { rotate: (i) => [-14, 8, 18][i], duration: 22, stagger: 4 }, 26)
        .to(".a-h2", { y: -50, opacity: 0, duration: 6, stagger: 1 }, 46)
        // Fechar.
        .to(r.cap, { lift: 0, duration: 6, ease: "power2.inOut" }, 56)
        .to(r.coconut, { rotX: 0, duration: 6, ease: "power2.inOut" }, 56)
        // Virar lata: shake, spin, burst, swap behind the particles.
        .fromTo(".a-meter", { opacity: 0 }, { opacity: 1, duration: 2 }, 59)
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
        .fromTo(r.can, { scale: 0, rotY: -Math.PI * 2 }, { scale: 0.85, rotY: 0, duration: 6, ease: "power3.out" }, 68.5)
        .to(".a-meter", { opacity: 0, duration: 2 }, 78)
        // Lata gira: front label, then the back.
        .fromTo(".a-h3", { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 5, ease: "power2.out" }, 74)
        .to(r.can, { rotY: Math.PI, duration: 16, ease: "sine.inOut" }, 76)
        .fromTo(".a-body3", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 4 }, 80)
        // Saída: the dark section rises over the can.
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
            <h1 className="a-intro absolute top-[12vh] left-[6vw] -rotate-2 font-display text-[clamp(4rem,11vw,10rem)] leading-[0.9] tracking-[-0.02em]">
              Só o
              <br />
              coco.
              <svg viewBox="0 0 300 20" className="mt-2 h-4 w-[70%] text-letreiro" aria-hidden>
                <path d="M2 14 C 80 4, 200 2, 298 10" stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none" />
              </svg>
            </h1>
            <h2 className="a-h2 absolute top-[14vh] left-[6vw] -rotate-1 font-display text-[clamp(3rem,8vw,7.5rem)] leading-[0.9] tracking-[-0.02em] opacity-0">
              Coco,
              <br />
              gelo
            </h2>
            <Badge className="a-badge top-full left-[56vw]">{badgeLabels[1]}</Badge>
            <h2 className="a-h3 absolute top-[18vh] left-[6vw] -rotate-2 font-display text-[clamp(4rem,10vw,9rem)] leading-[0.9] tracking-[-0.02em] opacity-0">
              Gelado.
            </h2>
          </>
        }
        stage={<Stage rig={rig} crack="cap" />}
        front={
          <>
            <ul className="a-intro absolute bottom-[14vh] left-[8vw] space-y-1 text-sm font-semibold">
              <li>• água de coco, polpa e gás</li>
              <li>• mais nada</li>
            </ul>
            <p className="a-intro absolute right-[6vw] bottom-[14vh] max-w-64 text-base">
              Um coco verde, aberto no facão e posto na lata. Levemente gaseificado. Pode abrir.
            </p>
            <h2 className="a-h2 absolute right-[6vw] bottom-[16vh] rotate-1 text-right font-display text-[clamp(3rem,8vw,7.5rem)] leading-[0.9] tracking-[-0.02em] opacity-0">
              e paciência.
            </h2>
            <Badge className="a-badge top-full left-[18vw]">{badgeLabels[0]}</Badge>
            <Badge className="a-badge top-full right-[14vw]">{badgeLabels[2]}</Badge>
            <div className="a-meter absolute bottom-[8vh] left-[6vw] w-64 opacity-0">
              <div className="flex justify-between font-display text-sm uppercase">
                <span className="a-label">{meterLabels[0]}</span>
                <span className="a-count tabular-nums">000</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-isopor">
                <div className="a-bar h-full w-0 rounded-full bg-fibra" />
              </div>
            </div>
            <p className="a-body3 absolute right-[6vw] bottom-[16vh] max-w-64 opacity-0">
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
