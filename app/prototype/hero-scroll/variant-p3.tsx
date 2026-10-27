"use client";

// PROTOTYPE phone variant P3, "Close": the object stays as big as the phone allows (nearly the full
// width) and the type works around it. Split headlines stack vertically, the first line behind the
// object's top and the second in front of its body; small copy sits on Polpa boards so it reads
// over the husk. Badges cross sideways in front (none behind: the object hides it). Girar is
// shortened, Lata gira gets the time back, and the scroll is 6 screens.
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "./gsap";
import { Hud } from "./hud";
import { type Beat, createRig } from "./rig";
import { AfterHero, Badge, badgeLabels, HeroLayers, Stage } from "./ui";

export const name = "Close: objeto grande";

const beats: Beat[] = [
  { name: "Girar", from: 0, to: 15 },
  { name: "Facão", from: 15, to: 20 },
  { name: "Selos", from: 20, to: 46 },
  { name: "Fechar", from: 46, to: 52 },
  { name: "Virar lata", from: 52, to: 66 },
  { name: "Lata gira", from: 66, to: 90 },
  { name: "Saída", from: 90, to: 100 },
];

const meterLabels = ["Coco inteiro", "Chacoalhando", "Na lata"];

function phoneRig() {
  const r = createRig();
  r.coconut.scale = 0.88;
  r.coconut.y = 0.05;
  return r;
}

const display = "font-display leading-[0.9] tracking-[-0.02em]";
const plaque = "rounded-[18px_10px_16px_8px] bg-polpa px-3 py-2 shadow-[3px_4px_0_var(--color-fibra)]";

export function VariantP3() {
  const root = useRef<HTMLElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const [rig] = useState(phoneRig);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const r = rig;
      const count = root.current!.querySelector(".p3-count")!;
      const label = root.current!.querySelector(".p3-label")!;
      const bar = root.current!.querySelector<HTMLElement>(".p3-bar")!;
      const meter = { v: 0 };

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(r.coconut, { y: -2.8, scale: 0.4, rotZ: -0.3, duration: 2 })
        .from(".p3-intro", { y: 30, opacity: 0, stagger: 0.15, duration: 1.4 }, 0.5);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "+=600%", pin: true, scrub: 1.2 },
      });
      timeline.current = tl;

      tl.to(r.coconut, { rotY: 0.5 + Math.PI, rotX: 0.12, duration: 15, ease: "sine.inOut" }, 0)
        .to(".p3-intro", { y: -40, opacity: 0, stagger: 0.8, duration: 5 }, 6)
        .to(r.coconut, { rotX: 0.45, duration: 4, ease: "power2.out" }, 14)
        .to(r.cap, { lift: 1, duration: 3, ease: "expo.out" }, 16)
        .fromTo(".p3-h2", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 5, stagger: 1.5, ease: "power2.out" }, 17)
        // Selos: three crossings at different heights, right to left, all in front.
        .fromTo(
          ".p3-badge",
          { x: "60vw", rotate: 10 },
          { x: "-160vw", rotate: (i) => [-12, 6, -8][i], duration: 14, stagger: 5 },
          21,
        )
        .to(".p3-h2", { y: -40, opacity: 0, duration: 5, stagger: 1 }, 40)
        .to(r.cap, { lift: 0, duration: 6, ease: "power2.inOut" }, 46)
        .to(r.coconut, { rotX: 0, duration: 6, ease: "power2.inOut" }, 46)
        .fromTo(".p3-meter", { opacity: 0 }, { opacity: 1, duration: 2 }, 50)
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
          51,
        )
        .to(r, { shake: 1, duration: 5, ease: "power1.in" }, 52)
        .to(r.coconut, { rotY: `+=${Math.PI * 2}`, duration: 6, ease: "power2.in" }, 53)
        .to(r, { burst: 1, duration: 8 }, 56)
        .to(r, { shake: 0, duration: 1 }, 58)
        .to(r.coconut, { scale: 0, duration: 1 }, 58)
        .fromTo(r.can, { scale: 0, rotY: -Math.PI * 2 }, { scale: 1, rotY: 0, duration: 6, ease: "power3.out" }, 58.5)
        .to(".p3-meter", { opacity: 0, duration: 2 }, 66)
        .fromTo(".p3-h3", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 5, stagger: 1.5, ease: "power2.out" }, 66)
        .to(r.can, { rotY: Math.PI, duration: 20, ease: "sine.inOut" }, 68)
        .fromTo(".p3-body3", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 4 }, 74)
        .fromTo(".dark-panel", { yPercent: 100 }, { yPercent: 0, duration: 10, ease: "power2.inOut" }, 90)
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
            <h1 className={`p3-intro absolute top-[11svh] left-5 -rotate-2 text-[24vw] ${display}`}>Só o</h1>
            <h2 className={`p3-h2 absolute top-[10svh] left-5 -rotate-1 text-[17vw] opacity-0 ${display}`}>Coco, gelo</h2>
            <h2 className={`p3-h3 absolute top-[8svh] left-5 -rotate-2 text-[22vw] opacity-0 ${display}`}>Gela</h2>
          </>
        }
        stage={<Stage rig={rig} crack="cap" />}
        front={
          <>
            <p className={`p3-intro absolute top-[58svh] right-5 rotate-1 text-right text-[24vw] ${display}`}>
              coco.
              <svg viewBox="0 0 300 20" className="ml-auto h-3 w-[80%] text-letreiro" aria-hidden>
                <path d="M2 14 C 80 4, 200 2, 298 10" stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none" />
              </svg>
            </p>
            <p className={`p3-intro absolute bottom-[7svh] left-5 max-w-[78vw] -rotate-1 text-[14px] leading-snug ${plaque}`}>
              Um coco verde, aberto no facão e posto na lata. Água de coco, polpa e gás. Mais nada.
            </p>
            <h2 className={`p3-h2 absolute top-[66svh] right-5 rotate-1 text-right text-[12vw] opacity-0 ${display}`}>
              e paciência.
            </h2>
            {[0, 1, 2].map((i) => (
              <Badge key={i} className={`p3-badge left-[100vw] ${["top-[18svh]", "top-[44svh]", "top-[68svh]"][i]}`}>
                {badgeLabels[i]}
              </Badge>
            ))}
            <div className={`p3-meter absolute right-5 bottom-[7svh] left-5 opacity-0 ${plaque}`}>
              <div className="flex justify-between font-display text-sm uppercase">
                <span className="p3-label">{meterLabels[0]}</span>
                <span className="p3-count tabular-nums">000</span>
              </div>
              <div className="mt-1 h-2.5 rounded-full bg-isopor">
                <div className="p3-bar h-full w-0 rounded-full bg-fibra" />
              </div>
            </div>
            <h2 className={`p3-h3 absolute top-[72svh] right-5 rotate-1 text-right text-[22vw] opacity-0 ${display}`}>do.</h2>
            <p className={`p3-body3 absolute bottom-[5svh] left-5 max-w-[70vw] rotate-1 text-[14px] leading-snug opacity-0 ${plaque}`}>
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
