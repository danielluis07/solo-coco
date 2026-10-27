// PROTOTYPE label A, "Placa": the can is the kiosk sign. Type only, no fruit art.
import { Board, CocoSymbol, display, fit, Lines, Wordmark } from "./kit";
import { ingredients, palette, strip, type Flavour } from "./tokens";

export const name = "Placa";

export const notes = [
  "The whole wrap is the Flavour accent; Só o Coco is Casca.",
  "Front: a Polpa board nailed on, carrying the symbol and the Casca wordmark (logo exemption), with the Flavour name on a Letreiro plaque below it.",
  "Side: “Coco gelado” painted vertically, the roadside letreiro.",
  "Back: “Só o coco.”, ingredients, kcal and açúcar.",
  "Fruit art: none. The painted name is the fruit; colour does the rest.",
];

export function Label({ f, id }: { f: Flavour; id: string }) {
  const { front, side, back, w, h } = strip;
  const plaqueW = 600;
  return (
    <>
      <rect width={w} height={h} fill={f.accent} />

      {/* Front */}
      <Board x={front - 280} y={110} w={560} h={560} fill={palette.polpa} tilt={-2}>
        <CocoSymbol id={`${id}-f`} x={front} y={250} size={200} />
        <Wordmark x={front} y={500} size={86} fill={palette.casca} />
        <Lines x={front} y={590} size={38} fill={palette.fibra} lines={["Levemente gaseificado"]} weight={600} />
      </Board>
      <Board x={front - plaqueW / 2} y={735} w={plaqueW} h={150} fill={palette.letreiro} tilt={1.5} radii={[18, 30, 14, 26]}>
        <text
          x={front}
          y={838}
          fill={palette.polpa}
          fontSize={fit(f.name, plaqueW - 70, 96)}
          textAnchor="middle"
          letterSpacing={-2}
          style={{ fontFamily: display }}>
          {f.name}
        </text>
      </Board>
      <Lines x={front} y={975} size={36} fill={f.ink} lines={["350 ml"]} weight={700} />

      {/* Side: the vertical kiosk sign */}
      <text
        x={side}
        y={h / 2}
        fill={f.ink}
        fontSize={120}
        textAnchor="middle"
        dominantBaseline="central"
        letterSpacing={-3}
        transform={`rotate(-90 ${side} ${h / 2})`}
        style={{ fontFamily: display }}>
        Coco gelado
      </text>

      {/* Back */}
      <text x={back} y={250} fill={f.ink} fontSize={118} textAnchor="middle" transform={`rotate(-2 ${back} 250)`} style={{ fontFamily: display }}>
        Só o coco.
      </text>
      <Lines
        x={back}
        y={420}
        size={40}
        fill={f.ink}
        lines={[...wrap(ingredients(f), 30), "", `${f.kcal} kcal e ${f.sugar} g de açúcar`, "por lata de 350 ml."]}
      />
      <Lines x={back} y={900} size={34} fill={f.ink} lines={["Feito no Brasil, sem pressa."]} weight={600} />
    </>
  );
}

/** Naive word wrap to about `max` characters a line. */
export function wrap(text: string, max: number) {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (line + " " + word).length > max) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out;
}
