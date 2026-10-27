import { copy } from "@/content/page";
import { CocoSymbol, Wordmark } from "./brand";

const { footer } = copy;

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-fibra bg-grain-dark text-polpa">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-8 md:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-4">
          <CocoSymbol className="size-12 shrink-0" />
          <div>
            <Wordmark text={footer.wordmark} className="text-3xl" />
            <p className="mt-1">{footer.tagline}</p>
          </div>
        </div>
        <nav>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 font-semibold">
            {footer.nav.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="inline-flex min-h-11 items-center underline underline-offset-4">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="max-w-2xl text-sm text-polpa/80 md:col-span-2">{footer.disclosure}</p>
      </div>
    </footer>
  );
}
