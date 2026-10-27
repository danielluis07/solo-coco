// PROTOTYPE: throwaway can-label prototype for "What does each Flavour's can label look like?" (#10).
// Three label systems on one route, switchable via ?variant=A|B|C. Lives on the
// prototype/can-label branch only; never merged to main.
import { Suspense } from "react";
import { CanLabel } from "./can-label";
import { canLabelFonts } from "./fonts";

// The variant comes from the URL at runtime; a throwaway route is allowed to block.
export const instant = false;

export default function CanLabelPage() {
  return (
    <div className={`${canLabelFonts} flex-1`}>
      <Suspense>
        <CanLabel />
      </Suspense>
    </div>
  );
}
