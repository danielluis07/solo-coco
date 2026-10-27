import { Bowlby_One, Figtree } from "next/font/google";

// Display face. Google ships the latin subset only; it covers ã ç õ é.
export const bowlbyOne = Bowlby_One({
  variable: "--font-bowlby-one",
  weight: "400",
  subsets: ["latin"],
});

export const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
});
