// PROTOTYPE: palette, Flavour data and strip geometry for the can-label prototype.

export const palette = {
  casca: "#7BA23F",
  cascaFunda: "#4E7A1F",
  polpa: "#FAFAF5",
  fibra: "#3A2A1D",
  letreiro: "#D7261E",
  isopor: "#DCE6EA",
} as const;

export type FruitKey = "coco" | "maracuja" | "caju" | "acai" | "limao" | "goiaba";

export type Flavour = {
  name: string;
  fruit: FruitKey;
  /** Fruit name as it reads in an ingredient list. */
  juice: string | null;
  accent: string;
  /** Text colour that passes AA on the accent fill. */
  ink: string;
  kcal: number;
  sugar: number;
};

export const flavours: Flavour[] = [
  { name: "Só o Coco", fruit: "coco", juice: null, accent: palette.casca, ink: palette.fibra, kcal: 35, sugar: 3 },
  { name: "Maracujá", fruit: "maracuja", juice: "maracujá", accent: "#F2B628", ink: palette.fibra, kcal: 48, sugar: 6 },
  { name: "Caju", fruit: "caju", juice: "caju", accent: "#E8662A", ink: palette.fibra, kcal: 50, sugar: 6 },
  { name: "Açaí", fruit: "acai", juice: "açaí", accent: "#5B2A6E", ink: palette.polpa, kcal: 52, sugar: 7 },
  { name: "Limão", fruit: "limao", juice: "limão", accent: "#B5CC3A", ink: palette.fibra, kcal: 42, sugar: 4 },
  { name: "Goiaba", fruit: "goiaba", juice: "goiaba", accent: "#EE8FA0", ink: palette.fibra, kcal: 55, sugar: 7 },
];

/**
 * The label is one UV strip wrapping the 350 ml can (66 mm across, so ~207 mm round,
 * ~100 mm of printed body): about 2:1. 2048 x 1024 keeps KTX2 dimensions multiples of 4.
 * The seam sits on the can's left side (u = 0 = 1), so neither the front nor the back
 * the hero shows in "Lata gira" ever crosses it.
 */
export const strip = {
  w: 2048,
  h: 1024,
  front: 512, // u = 0.25
  side: 1024, // u = 0.5, the right side
  back: 1536, // u = 0.75
  /** Half-width of the panel that reads face-on before the curve foreshortens it. */
  panel: 320,
} as const;

/** Placeholder ingredient line; the real wording belongs to the Copy ticket. */
export function ingredients(f: Flavour) {
  return f.juice
    ? `Água de coco, suco de ${f.juice} e gás carbônico.`
    : "Água de coco, polpa de coco e gás carbônico.";
}
