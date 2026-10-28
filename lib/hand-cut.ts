// The uneven, hand-cut top edge of the dark Fibra statement, drawn once here:
// as the statement's own edge in Static, and as the line that wipes the Hero
// away onto it in the Vitrine's Saída. DESIGN.md § Hero choreography (Saída).

/** The cut's points: x across the width (0–1), y down a 24 px band. */
const points: [number, number][] = [
  [0, 14],
  [0.1167, 9],
  [0.2583, 16],
  [0.3917, 6],
  [0.5333, 13],
  [0.6833, 4],
  [0.825, 12],
  [1, 7],
];

/** The band the cut is drawn in, in px. */
export const handCutDepth = 24;

/** The Fibra below the cut, as an SVG path in a 1200 × 24 box. */
export const handCutPath = `M0 ${handCutDepth} ${points.map(([x, y]) => `L${Math.round(x * 1200)} ${y}`).join(" ")} L1200 ${handCutDepth} Z`;

/**
 * A clip that keeps what lies above the cut, with the cut's band starting `fromTop`
 * down the element: 0 at its top (nothing kept) to 1 at its bottom (all of it).
 */
export function aboveHandCut(fromTop: number) {
  const edge = points
    .toReversed()
    .map(([x, y]) => `${x * 100}% calc(${fromTop * 100}% + ${round(y - (1 - fromTop) * handCutDepth)}px)`);
  return `polygon(0 0, 100% 0, ${edge.join(", ")})`;
}

const round = (value: number) => Math.round(value * 100) / 100;
