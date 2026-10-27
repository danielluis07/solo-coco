// PROTOTYPE label C, "Faixa": a white can with one accent band and the name running round it.
import { Board, CocoSymbol, display, fit, Fruit, Lines, Wordmark } from "./kit";
import { wrap } from "./label-a";
import { ingredients, palette, strip, type Flavour } from "./tokens";

export const name = "Faixa";

export const notes = [
  "Polpa wrap for every can, like the flesh or the cooler; the Flavour lives in one band.",
  "The band runs all the way round with the name repeated three times, so it reads at any point of the spin, seam included.",
  "Front: a big Casca symbol and the Casca wordmark above the band (logo exemption on Polpa).",
  "Back: a small painted fruit on an Isopor board, then ingredients, kcal and açúcar.",
  "Fruit art: back only, small. The front stays pure brand, so the hero can reads as SoloCoco first.",
];

const bandTop = 580;
const bandH = 190;

export function Label({ f, id }: { f: Flavour; id: string }) {
  const { front, back, w, h } = strip;
  const step = w / 3;
  // Three repeats a third of the strip apart; the one at front − step straddles the seam.
  const repeats = [front - step, front, front + step, front + 2 * step];
  return (
    <>
      <rect width={w} height={h} fill={palette.polpa} />
      <rect y={bandTop} width={w} height={bandH} fill={f.accent} />
      <rect y={bandTop - 10} width={w} height={10} fill={palette.fibra} />
      <rect y={bandTop + bandH} width={w} height={10} fill={palette.fibra} />
      {repeats.map((x) => (
        <text
          key={x}
          x={x}
          y={bandTop + bandH / 2}
          fill={f.ink}
          fontSize={fit(f.name, 560, 118)}
          textAnchor="middle"
          dominantBaseline="central"
          letterSpacing={-2}
          style={{ fontFamily: display }}>
          {f.name}
        </text>
      ))}

      {/* Front */}
      <CocoSymbol id={`${id}-f`} x={front} y={210} size={300} />
      <Wordmark x={front} y={500} size={108} fill={palette.casca} />
      <Lines x={front} y={880} size={40} fill={palette.fibra} lines={["Levemente gaseificado", "350 ml"]} weight={600} />

      {/* Back */}
      <Board x={back - 170} y={70} w={340} h={300} fill={palette.isopor} tilt={2}>
        <Fruit kind={f.fruit} x={back} y={220} size={230} />
      </Board>
      <text x={back} y={500} fill={palette.fibra} fontSize={84} textAnchor="middle" transform={`rotate(-2 ${back} 500)`} style={{ fontFamily: display }}>
        Só o coco.
      </text>
      <Lines x={back} y={845} size={34} fill={palette.fibra} lines={[...wrap(ingredients(f), 34), `${f.kcal} kcal e ${f.sugar} g de açúcar por lata.`]} />
    </>
  );
}
