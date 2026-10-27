"use client";

// PROTOTYPE variant B, "Câmera": the object barely moves; the camera does. It opens close on the
// husk and pulls back, orbits, then rises to look straight down into the cut coconut (which reads
// as the brand symbol from above), with badges pinned around the rim in 3D. It drops back to eye
// level as the can rises out of the coconut, then orbits the can to show its back. One big word
// per beat, always behind the object.
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "./gsap";
import { Hud } from "./hud";
import { type Beat, createRig } from "./rig";
import type { Anchor } from "./stage";
import { AfterHero, Badge, badgeLabels, HeroLayers, Stage } from "./ui";

export const name = "Câmera: travelling";

const beats: Beat[] = [
  { name: "Aproximação", from: 0, to: 14 },
  { name: "Órbita", from: 14, to: 28 },
  { name: "Facão", from: 28, to: 33 },
  { name: "De cima", from: 33, to: 56 },
  { name: "Virar lata", from: 56, to: 72 },
  { name: "Volta na lata", from: 72, to: 92 },
  { name: "Saída", from: 92, to: 100 },
];

// Around the rim of the cut, in world units (coconut scale 0.8, cut at local y 0.5).
const anchors: Anchor[] = badgeLabels.map((_, i) => {
  const a = 0.6 + (i * Math.PI * 2) / 3;
  return [Math.sin(a) * 1.25, 0.4, Math.cos(a) * 1.25];
});

const word = "absolute inset-0 grid place-items-center font-display leading-[0.85] tracking-[-0.02em] opacity-0";

export function VariantB() {
  const root = useRef<HTMLElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const [rig] = useState(createRig);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const r = rig;
      Object.assign(r.coconut, { scale: 0.8, rotY: 0.5 });
      Object.assign(r.cam, { r: 2.3, elev: 0.18, azim: -0.35 });

      gsap.fromTo(".b-title", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 1.6, ease: "power2.out" });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "+=800%", pin: true, scrub: 1.5 },
      });
      timeline.current = tl;

      // Aproximação: pull back from the husk to the whole coconut.
      tl.to(r.cam, { r: 6.5, elev: 0.08, azim: 0, duration: 14, ease: "power2.inOut" }, 0)
        .to(".b-title", { opacity: 0, scale: 0.94, duration: 4 }, 10)
        // Órbita.
        .to(r.cam, { azim: 1.1, elev: 0.3, duration: 14, ease: "sine.inOut" }, 14)
        .fromTo(".b-w1", { opacity: 0 }, { opacity: 1, duration: 4 }, 15)
        .to(".b-w1", { opacity: 0, duration: 4 }, 24)
        // Facão: the cap is swiped off sideways.
        .to(r.cap, { slide: 1, duration: 3, ease: "expo.out" }, 28)
        .to(r.coconut, { rotZ: 0.06, duration: 1, ease: "power4.out" }, 28)
        .to(r.coconut, { rotZ: 0, duration: 3, ease: "power2.inOut" }, 29)
        // De cima: rise to look down into the cut; badges appear around the rim.
        .to(r.cam, { elev: 1.5, r: 5.2, azim: 1.7, lookY: 0.35, duration: 11, ease: "power2.inOut" }, 31)
        .to(r.badges, { 0: 1, duration: 3 }, 40)
        .to(r.badges, { 1: 1, duration: 3 }, 44)
        .to(r.badges, { 2: 1, duration: 3 }, 48)
        .fromTo(".b-w2", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 4 }, 42)
        .to(".b-w2", { opacity: 0, duration: 3 }, 54)
        // Virar lata: drop to eye level while the coconut sinks and the can rises out of it.
        .to(r.badges, { 0: 0, 1: 0, 2: 0, duration: 3 }, 56)
        .to(r.cam, { elev: 0.06, r: 6.5, azim: Math.PI * 2, lookY: 0, duration: 12, ease: "power2.inOut" }, 56)
        .to(r, { shake: 1, duration: 4, ease: "power1.in" }, 58)
        .to(r, { burst: 1, duration: 8 }, 61)
        .to(r, { shake: 0, duration: 1 }, 63)
        .to(r.coconut, { y: -0.6, scale: 0, duration: 2, ease: "power2.in" }, 62)
        .fromTo(
          r.can,
          { y: -1.2, scale: 0, rotY: -Math.PI },
          { y: 0, scale: 0.85, rotY: 0, duration: 6, ease: "power3.out" },
          64,
        )
        // Volta na lata: the camera walks round to the back label.
        .fromTo(".b-w3", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 5 }, 70)
        .to(r.cam, { azim: Math.PI * 3, duration: 18, ease: "sine.inOut" }, 72)
        // Saída.
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
            <h1 className={`b-title ${word} text-[clamp(5rem,17vw,16rem)]`}>Só o coco.</h1>
            <p className={`b-w1 ${word} text-[clamp(5rem,20vw,19rem)] text-casca`}>Inteiro.</p>
            <p className={`b-w3 ${word} text-[clamp(5rem,22vw,21rem)]`}>Gelado.</p>
          </>
        }
        stage={<Stage rig={rig} crack="cap" anchors={anchors} />}
        front={
          <>
            {badgeLabels.map((label, i) => (
              <Badge key={label} anchor={i} className="top-0 left-0 opacity-0">
                {label}
              </Badge>
            ))}
            <p className="b-w2 absolute bottom-[10vh] left-[6vw] max-w-sm -rotate-1 font-display text-4xl leading-[0.95] opacity-0">
            Visto de cima,
            <br />é só isso.
            </p>
          </>
        }
      />
      <AfterHero />
      <Hud beats={beats} total={100} timeline={timeline} rig={rig} />
    </main>
  );
}
