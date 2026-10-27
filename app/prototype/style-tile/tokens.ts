// PROTOTYPE: palette and Flavour data for the style tile, plus WCAG contrast maths.

export const palette = {
  casca: "#7BA23F",
  cascaFunda: "#4E7A1F",
  polpa: "#FAFAF5",
  fibra: "#3A2A1D",
  letreiro: "#D7261E",
  isopor: "#DCE6EA",
} as const;

export const baseTokens = [
  { name: "Casca", hex: palette.casca, role: "Husk. Fields, the can, the symbol." },
  { name: "Casca funda", hex: palette.cascaFunda, role: "Proposed: Casca for text and links on Polpa." },
  { name: "Polpa", hex: palette.polpa, role: "Flesh. Main background." },
  { name: "Fibra", hex: palette.fibra, role: "Fibre. Text and the dark section." },
  { name: "Letreiro", hex: palette.letreiro, role: "Sign-paint red. Quick-add, one highlight." },
  { name: "Isopor", hex: palette.isopor, role: "Cooler. Surfaces and dividers." },
];

export type Flavour = {
  name: string;
  accent: string;
  /** Text colour that passes AA on the accent fill. */
  ink: string;
  kcal: number;
  sugar: number;
  line: string;
};

export const flavours: Flavour[] = [
  { name: "Só o Coco", accent: palette.casca, ink: palette.fibra, kcal: 35, sugar: 3, line: "O original. Sem fruta, sem desculpa." },
  { name: "Maracujá", accent: "#F2B628", ink: palette.fibra, kcal: 48, sugar: 6, line: "Azedinho no fundo. O coco na frente." },
  { name: "Caju", accent: "#E8662A", ink: palette.fibra, kcal: 50, sugar: 6, line: "Aquele travo do caju, sem amarrar a boca." },
  { name: "Açaí", accent: "#5B2A6E", ink: palette.polpa, kcal: 52, sugar: 7, line: "Escuro, calmo, sem tigela." },
  { name: "Limão", accent: "#B5CC3A", ink: palette.fibra, kcal: 42, sugar: 4, line: "Um pingo de limão. Só um." },
  { name: "Goiaba", accent: "#EE8FA0", ink: palette.fibra, kcal: 55, sugar: 7, line: "Goiaba de quintal, coco de barraca." },
];

export const packs = [
  { label: "1 lata", price: "R$ 6,90" },
  { label: "6 latas", price: "R$ 37,90" },
  { label: "12 latas", price: "R$ 69,90" },
];

export const badges = ["Só 3 ingredientes", "Levemente gaseificado", "Estupidamente gelado"];

export const rotatingWords = ["gelo.", "paciência.", "uma fruta.", "mais nada."];

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** "AA" for body text, "AA grande" for 24px+ display only, "—" for neither. */
export function grade(ratio: number) {
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA grande";
  return "—";
}
