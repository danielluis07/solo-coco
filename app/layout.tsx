import type { Metadata } from "next";
import "./globals.css";
import { bowlbyOne, figtree } from "@/fonts";
import { seo } from "@/content/page";

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bowlbyOne.variable} ${figtree.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
