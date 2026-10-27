"use client";

import Lenis from "lenis";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import { gsap, ScrollTrigger } from "./gsap";
import * as A from "./variant-a";
import * as B from "./variant-b";
import * as C from "./variant-c";

const variants = [
  { key: "A", name: A.name, Component: A.VariantA },
  { key: "B", name: B.name, Component: B.VariantB },
  { key: "C", name: C.name, Component: C.VariantC },
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
