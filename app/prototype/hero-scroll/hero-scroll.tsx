"use client";

import Lenis from "lenis";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import { gsap, ScrollTrigger } from "./gsap";
import * as A from "./variant-a";
import * as P1 from "./variant-p1";
import * as P2 from "./variant-p2";
import * as P3 from "./variant-p3";

const variants = [
  { key: "A", name: A.name, Component: A.VariantA },
  // Phone variants for "How does the hero behave on phones?" (#11). B and C lost in #8 and stay in
  // the history of this branch.
  { key: "P1", name: P1.name, Component: P1.VariantP1 },
  { key: "P2", name: P2.name, Component: P2.VariantP2 },
  { key: "P3", name: P3.name, Component: P3.VariantP3 },
];

export function HeroScroll() {
  const params = useSearchParams();
  const current = params.get("variant") ?? "A";
  /** `?at=0.4` jumps to 40% of the pinned hero, to link straight to a beat. */
  const at = Number(params.get("at") ?? 0);
  const { key, Component } = variants.find((v) => v.key === current) ?? variants[0];

  // Lenis smooths the whole page and drives ScrollTrigger from GSAP's ticker (ADR 0001).
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    ScrollTrigger.refresh();
    const pin = ScrollTrigger.getAll().find((st) => st.pin);
    window.scrollTo(0, pin && at ? pin.start + (pin.end - pin.start) * at : 0);
  }, [key, at]);

  return (
    <>
      <Component key={key} />
      <PrototypeSwitcher variants={variants} current={key} />
    </>
  );
}
