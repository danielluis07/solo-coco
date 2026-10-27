"use client";

// PROTOTYPE: floating variant switcher for throwaway prototype routes. Never ships.
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  variants: { key: string; name: string }[];
  current: string;
};

export function PrototypeSwitcher({ variants, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );

  const go = (step: number) => {
    const next = variants[(index + step + variants.length) % variants.length];
    router.replace(`${pathname}?variant=${next.key}`, { scroll: false });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black px-2 py-1.5 font-sans text-sm text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)] ring-2 ring-fuchsia-500">
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous variant"
        className="rounded-full px-3 py-1 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-fuchsia-400">
        ←
      </button>
      <span className="min-w-48 text-center tabular-nums">
        {variants[index].key} ({variants[index].name})
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next variant"
        className="rounded-full px-3 py-1 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-fuchsia-400">
        →
      </button>
    </div>
  );
}
