// PROTOTYPE: throwaway hero choreography for "How does the hero scroll sequence move?" (#8).
// Three choreographies of the same beats on one route, switchable via ?variant=A|B|C.
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
