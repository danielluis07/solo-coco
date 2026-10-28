// Every piece of page Copy, the Flavour lineup and the SEO strings.
// Copy is approved in https://github.com/danielluis07/solo-coco/issues/9,
// Flavour data in DESIGN.md § Flavour lineup, SEO strings in DESIGN.md § SEO.
// Components read from here and contain no Copy literals.

export const brand = "SoloCoco";
export const tagline = "Só o coco.";

/** In-page anchor targets shared by the header, the CTAs and the footer. */
export const anchors = {
  top: "topo",
  statement: "o-coco",
  grid: "sabores",
} as const;

export type Link = { label: string; href: `#${string}` };

const toStatement = (label: string): Link => ({ label, href: `#${anchors.statement}` });
const toGrid = (label: string): Link => ({ label, href: `#${anchors.grid}` });
const toTop = (label: string): Link => ({ label, href: `#${anchors.top}` });

export type InkToken = "fibra" | "polpa";

export type Flavour = {
  slug: string;
  /** Fruit name alone; the card heading prefixes the brand on first mention. */
  name: string;
  /** Fill colour for the card wash and label. Matches the `flavour-*` theme token. */
  accent: string;
  /** Approved text colour on the accent: Polpa on Açaí, Fibra on the rest. */
  ink: InkToken;
  kcal: number;
  sugarGrams: number;
  descriptor: string;
};

export type Pack = {
  count: number;
  label: string;
  priceLabel: string;
};

export const flavours: readonly Flavour[] = [
  {
    slug: "so-o-coco",
    name: "Só o Coco",
    accent: "#7BA23F",
    ink: "fibra",
    kcal: 35,
    sugarGrams: 3,
    descriptor: "Coco e bolhinhas. Já basta.",
  },
  {
    slug: "maracuja",
    name: "Maracujá",
    accent: "#F2B628",
    ink: "fibra",
    kcal: 48,
    sugarGrams: 6,
    descriptor: "O azedinho chega. O coco fica.",
  },
  {
    slug: "caju",
    name: "Caju",
    accent: "#E8662A",
    ink: "fibra",
    kcal: 50,
    sugarGrams: 6,
    descriptor: "Caju na companhia. Coco no comando.",
  },
  {
    slug: "acai",
    name: "Açaí",
    accent: "#5B2A6E",
    ink: "polpa",
    kcal: 52,
    sugarGrams: 7,
    descriptor: "Açaí encontra coco. Sem colher.",
  },
  {
    slug: "limao",
    name: "Limão",
    accent: "#B5CC3A",
    ink: "fibra",
    kcal: 42,
    sugarGrams: 4,
    descriptor: "Um toque de limão. O resto é coco.",
  },
  {
    slug: "goiaba",
    name: "Goiaba",
    accent: "#EE8FA0",
    ink: "fibra",
    kcal: 55,
    sugarGrams: 7,
    descriptor: "Goiaba chegou de mansinho.",
  },
];

/** The same packs and prices for every Flavour. Decorative only. */
export const packs: readonly Pack[] = [
  { count: 1, label: "1 lata", priceLabel: "R$ 6,90" },
  { count: 6, label: "6 latas", priceLabel: "R$ 37,90" },
  { count: 12, label: "12 latas", priceLabel: "R$ 69,90" },
];

export const defaultPack = packs[0];

export const flavourTitle = (f: Flavour) => `${brand} ${f.name}`;
export const flavourStats = (f: Flavour) => `${f.kcal} kcal · ${f.sugarGrams} g de açúcar`;
export const packLabel = (p: Pack) => `${p.label} · ${p.priceLabel}`;
/** The one polite status message after a Quick-add change: the resulting quantity and price. */
export const quickAddAnnouncement = (f: Flavour, p: Pack) => `${flavourTitle(f)}: ${packLabel(p)}`;

export const copy = {
  header: {
    wordmark: brand,
    nav: [toStatement("O coco"), toGrid("Sabores")],
    cta: toGrid("Ver sabores"),
    motionOff: "Desativar animações",
  },

  hero: {
    // Girar
    opening: {
      headline: tagline,
      corner: "Bebida de coco levemente gaseificada.",
      oppositeCorner: "350 ml. Pra beber sem pressa.",
      cta: toGrid("Escolha seu coco"),
      scrollCue: "Desce mais um pouco.",
    },
    // Facão / Selos
    opened: {
      headline: ["Pode abrir.", "É coco."],
      badges: ["Só 3 ingredientes", "Levemente gaseificado", "Estupidamente gelado"],
    },
    // Virar lata. The counter is decorative and hidden from assistive technology.
    transformation: {
      meterLabels: ["Coco inteiro", "Chacoalhando", "Na lata"],
      counter: { from: "000", to: "100" },
    },
    // Lata gira
    rotatingCan: {
      headline: "A gente tirou o facão da história.",
      corner: "O coco ficou. As bolhinhas chegaram.",
      smallLine: "SoloCoco Só o Coco · 350 ml",
    },
  },

  statement: {
    headline: "Coco.",
    plaque: ["Gelado.", "Sem pressa.", "Do seu jeito."],
    body: "A ideia veio da barraca. Coco gelado, conversa curta, vontade de ficar. A gente levou isso pra lata.",
    closing: "Tem fruta, mas quem manda é o coco.",
    link: toGrid("Escolha seu coco"),
  },

  grid: {
    heading: "Qual é o seu coco?",
    intro: "Um só coco. Cinco boas companhias.",
    disclosure: "Marca fictícia. Nenhuma compra é realizada.",
    perCan: "Por lata de 350 ml",
  },

  quickAdd: {
    open: "Escolher",
    heading: "Quantas latas?",
    helper: "Só pra imaginar sua geladeira.",
    close: "Fechar",
  },

  footer: {
    wordmark: brand,
    tagline,
    nav: [toStatement("O coco"), toGrid("Sabores"), toTop("Voltar ao topo")],
    disclosure:
      "SoloCoco é uma marca fictícia. Produtos, preços e informações nutricionais são ilustrativos.",
  },
} as const;

export const seo = {
  title: "SoloCoco — Só o coco.",
  description:
    "Bebida de coco levemente gaseificada, com seis sabores e jeito de barraca. SoloCoco é uma marca fictícia. Nenhuma compra é realizada.",
  siteName: brand,
  locale: "pt_BR",
  type: "website",
  card: "summary_large_image",
  image: "/sharing-image.png",
  imageWidth: 1200,
  imageHeight: 630,
  imageAlt:
    "SoloCoco — Só o coco. Lata do sabor Só o Coco sobre fundo claro, com sombra marrom. Marca fictícia.",
} as const;
