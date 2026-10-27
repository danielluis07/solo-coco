import { FlavourGrid } from "@/components/flavour-grid";
import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Statement } from "@/components/statement";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Statement />
        <FlavourGrid />
      </main>
      <SiteFooter />
    </>
  );
}
