"use client";

import { copy } from "@/content/page";
import { useMotion } from "./motion-provider";

/** “Desativar animações”: pressed once the page is Static, by choice or by preference. */
export function MotionToggle() {
  const { motion, optOut } = useMotion();
  const off = motion?.tier === "static";
  return (
    <button
      type="button"
      aria-pressed={off}
      onClick={optOut}
      className="inline-flex min-h-11 cursor-pointer items-center rounded-board-alt border-2 border-fibra px-3 text-sm font-semibold aria-pressed:bg-fibra aria-pressed:text-polpa">
      {copy.header.motionOff}
    </button>
  );
}
