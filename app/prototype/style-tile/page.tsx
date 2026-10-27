// PROTOTYPE: throwaway style tile for "What should the visual direction look like?" (#7).
// Three visual directions on one route, switchable via ?variant=A|B|C. Lives on the
// prototype/style-tile branch only; never merged to main.
import { Suspense } from "react";
import { styleTileFonts } from "./fonts";
import { StyleTile } from "./style-tile";

export default function StyleTilePage() {
  return (
    <div className={`${styleTileFonts} flex-1`}>
      <Suspense>
        <StyleTile />
      </Suspense>
    </div>
  );
}
