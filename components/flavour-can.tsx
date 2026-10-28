"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** Reserve the card image box, then load only within 400px of the viewport.
 * Native lazy loading alone can fetch the grid before the Hero has been pinned.
 */
export function FlavourCan({ slug }: { slug: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      // Older browsers retain native lazy loading.
      const frame = requestAnimationFrame(() => setNear(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: "400px" });
    // The pre-hydration Vitrine is only one screen tall; wait for the Hero's
    // pin or Static fallback before measuring the grid's final position.
    const start = () => {
      const html = document.documentElement;
      const settled = html.dataset.heroLayout !== "vitrine" || html.dataset.motionTier === "static"
        || document.querySelector('[data-hero-stage][data-pinned]') !== null;
      if (settled) {
        changes.disconnect();
        observer.observe(container.current!);
      }
    };
    const changes = new MutationObserver(start);
    changes.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["data-pinned", "data-motion-tier", "data-hero-layout"] });
    start();
    return () => { observer.disconnect(); changes.disconnect(); };
  }, []);
  const image = <Image src={`/flavours/${slug}.webp`} alt="" width={360} height={520}
    loading="lazy" unoptimized className="h-full w-full" />;
  return (
    <div ref={container} className="mx-auto h-40 aspect-9/13" data-can-render={slug}>
      {near ? image : null}
      <noscript>{image}</noscript>
    </div>
  );
}
