// PROTOTYPE label B, "Barraca": a Casca husk for every can, a machete-cut fruit band below.
import { Board, CocoSymbol, display, fit, Fruit, Lines, Wordmark } from "./kit";
import { wrap } from "./label-a";
import { ingredients, palette, strip, type Flavour } from "./tokens";

export const name = "Barraca";

export const notes = [
  "Every can is Casca on top, so the six read as one family; coconut always leads.",
  "The bottom third is the Flavour band, its top edge a jagged machete cut that wraps the can. Só o Coco's band is Polpa: “Polpa label on Casca”.",
  "Front: symbol and Fibra wordmark on the husk; a painted fruit on a Polpa roundel sits on the cut; the name in the band.",
  "Back: “Só o coco.”, ingredients, kcal and açúcar on the husk.",
  "Fruit art: one painted fruit on the front (coconut half for Só o Coco) plus a small one on the side, in the juice-stand menu style. AI-sourced, repainted flat.",
];

/** The machete cut: an irregular zigzag at y ≈ 660 that starts and ends at the same height, so it tiles. */
const cut = (() => {
  const steps = [0, 26, -18, 34, -10, 22, -30, 14, -6, 30, -22, 18, -14, 28, -26, 10];
  const n = 32;
  const pts = Array.from({ length: n + 1 }, (_, i) => `${(i / n) * strip.w},${660 + (i === n ? 0 : steps[i % steps.length])}`);
  return `M0,${strip.h} L${pts.join(" L")} L${strip.w},${strip.h} Z`;
})();

export function Label({ f, id }: { f: Flavour; id: string }) {
  const { front, side, back, w, h } = strip;
  const band = f.fruit === "coco" ? palette.polpa : f.accent;
  const bandInk = f.fruit === "coco" ? palette.fibra : f.ink;
  return (
    <>
      <rect width={w} height={h} fill={palette.casca} />
      <path d={cut} fill={band} stroke={palette.fibra} strokeWidth={8} strokeLinejoin="round" />

      {/* Front */}
      <CocoSymbol id={`${id}-f`} x={front} y={130} size={170} husk={palette.fibra} />
      <Wordmark x={front} y={350} size={104} fill={palette.fibra} />
      <Lines x={front} y={440} size={38} fill={palette.fibra} lines={["Levemente gaseificado"]} weight={600} />
      <Board x={front - 150} y={480} w={300} h={300} fill={palette.polpa} radii={[150, 150, 150, 150]} tilt={0}>
        <Fruit kind={f.fruit} x={front} y={630} size={250} />
      </Board>
      <text
        x={front}
        y={905}
        fill={bandInk}
        fontSize={fit(f.name, 620, 104)}
        textAnchor="middle"
        letterSpacing={-2}
        transform={`rotate(-1.5 ${front} 905)`}
        style={{ fontFamily: display }}>
        {f.name}
      </text>
      <Lines x={front} y={985} size={32} fill={bandInk} lines={["350 ml"]} weight={700} />

      {/* Side */}
      <Fruit kind={f.fruit} x={side} y={850} size={150} />

      {/* Back */}
      <text x={back} y={200} fill={palette.fibra} fontSize={112} textAnchor="middle" transform={`rotate(-2 ${back} 200)`} style={{ fontFamily: display }}>
        Só o coco.
      </text>
      <Lines x={back} y={330} size={40} fill={palette.fibra} lines={[...wrap(ingredients(f), 30), "", `${f.kcal} kcal e ${f.sugar} g de açúcar`, "por lata."]} />
      <Lines x={back} y={880} size={36} fill={bandInk} lines={["350 ml", "Feito no Brasil, sem pressa."]} weight={600} />
    </>
  );
}
