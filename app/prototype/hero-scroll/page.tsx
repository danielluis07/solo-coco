// PROTOTYPE: throwaway hero choreography for "How does the hero scroll sequence move?" (#8).
// Variant A is the chosen desktop Vitrine; P1-P3 are its phone takes for "How does the hero behave
// on phones?" (#11), switchable via ?variant=A|P1|P2|P3. Judge them at /prototype/hero-scroll/phone.
// Lives on the prototype/hero-scroll branch only; never merged to main.
import { Suspense } from "react";
import { heroFonts } from "./fonts";
import { HeroScroll } from "./hero-scroll";

export default function HeroScrollPage() {
  return (
    <div className={`${heroFonts} font-body text-fibra`}>
      <Suspense>
        <HeroScroll />
      </Suspense>
    </div>
  );
}
