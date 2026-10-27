// PROTOTYPE: the DESIGN.md type shortlist, loaded side by side for the style tile.
import { Bowlby_One, Bungee, Figtree, Lilita_One, Work_Sans } from "next/font/google";

export const bowlbyOne = Bowlby_One({
  variable: "--font-bowlby-one",
  weight: "400",
  // Google ships Bowlby One as latin only; ã ç õ é are in that subset.
  subsets: ["latin"],
});

export const lilitaOne = Lilita_One({
  variable: "--font-lilita-one",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

export const bungee = Bungee({
  variable: "--font-bungee",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

export const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
});

export const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin", "latin-ext"],
});

export const styleTileFonts = [bowlbyOne, lilitaOne, bungee, figtree, workSans]
  .map((font) => font.variable)
  .join(" ");
