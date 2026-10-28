import { anchors, copy } from "@/content/page";
import { Wordmark } from "./brand";
import { MotionToggle } from "./motion-toggle";

const { header } = copy;

export function SiteHeader() {
  return (
    <header id={anchors.top} className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Wordmark text={header.wordmark} className="text-2xl text-fibra" />
          {/* Early in tab order, before any link into the page. */}
          <MotionToggle />
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <ul className="flex gap-5 font-semibold">
            {header.nav.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-casca-funda underline-offset-4 hover:underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={header.cta.href}
            className="inline-flex min-h-11 items-center rounded-board bg-letreiro px-4 font-bold text-polpa shadow-board-sm">
            {header.cta.label}
          </a>
        </nav>
      </div>
    </header>
  );
}
