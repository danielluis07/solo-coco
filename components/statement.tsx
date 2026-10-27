import { anchors, copy } from "@/content/page";

const { statement } = copy;

const plaqueTilt = ["-rotate-1", "rotate-[0.6deg]", "-rotate-[1.4deg]"];

/** The dark brand statement. Static shows all three plaque phrases in flow. */
export function Statement() {
  return (
    <section
      id={anchors.statement}
      aria-labelledby="statement-heading"
      className="relative scroll-mt-4 bg-fibra bg-grain-dark text-polpa">
      <HandCutEdge />
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <h2
          id="statement-heading"
          className="font-display text-[clamp(3.5rem,12vw,8rem)] leading-[0.9] tracking-[-0.02em]">
          {statement.headline}
        </h2>
        <ul className="mt-6 flex flex-wrap gap-4">
          {statement.plaque.map((phrase, i) => (
            <li
              key={phrase}
              className={`${plaqueTilt[i]} rounded-board bg-letreiro px-4 pb-1 font-display text-[clamp(1.75rem,6vw,3.5rem)] leading-[1.15] text-polpa`}>
              {phrase}
            </li>
          ))}
        </ul>
        <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-end">
          <p className="max-w-md text-lg leading-relaxed">{statement.body}</p>
          <div className="space-y-6 md:text-right">
            <p className="font-display text-2xl leading-tight">{statement.closing}</p>
            <a
              href={statement.link.href}
              className="inline-flex min-h-11 items-center rounded-board bg-letreiro px-5 py-2 font-bold text-polpa">
              {statement.link.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The panel's uneven, hand-cut top edge. */
function HandCutEdge() {
  return (
    <svg
      viewBox="0 0 1200 24"
      preserveAspectRatio="none"
      className="absolute inset-x-0 -top-[23px] h-6 w-full fill-fibra"
      aria-hidden="true"
      focusable="false">
      <path d="M0 24 L0 14 L140 9 L310 16 L470 6 L640 13 L820 4 L990 12 L1200 7 L1200 24 Z" />
    </svg>
  );
}
