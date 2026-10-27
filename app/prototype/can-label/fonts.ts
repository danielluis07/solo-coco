// PROTOTYPE: the locked DESIGN.md faces, Bowlby One + Figtree.
import { Bowlby_One, Figtree } from "next/font/google";

export const bowlbyOne = Bowlby_One({
  variable: "--font-bowlby-one",
  weight: "400",
  // Google ships Bowlby One as latin only; ã ç õ é are in that subset.
  subsets: ["latin"],
});

export const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
});

export const canLabelFonts = [bowlbyOne, figtree].map((font) => font.variable).join(" ");
