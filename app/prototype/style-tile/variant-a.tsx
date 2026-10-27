"use client";

// PROTOTYPE variant A, "Letreiro": the page as a run of hand-painted kiosk boards.
// Bowlby One + Figtree. Grain texture, lifted baselines, painted plaques.
import { ContrastSheet, CocoSymbol, grain, RotatingWord, useQuickAdd, Wordmark } from "./shared";
import { badges, flavours } from "./tokens";

const display = "var(--font-bowlby-one)";
const body = "var(--font-figtree)";
// Slightly uneven corners, like a board cut by hand.
const board = "rounded-[18px_10px_16px_8px]";

export const name = "Letreiro";

export function VariantA() {
  const qa = useQuickAdd();
  return (
    <main style={{ fontFamily: body, backgroundImage: grain }} className="bg-polpa text-fibra">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Wordmark className="text-2xl" color="#3A2A1D" />
        <CocoSymbol className="size-10" />
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-6 pb-20 sm:px-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 style={{ fontFamily: display }} className="-rotate-2 text-[clamp(3.5rem,11vw,8.5rem)] leading-[0.9] tracking-[-0.02em]">
            Só o coco.
          </h1>
          <svg viewBox="0 0 400 24" className="mt-3 h-5 w-[70%] -rotate-2" aria-hidden="true">
            <path d="M4 16 C 90 6, 200 20, 396 8" stroke="#D7261E" strokeWidth="9" strokeLinecap="round" fill="none" />
          </svg>
          <p className="mt-8 max-w-md text-lg leading-relaxed">
            Coco verde, um pouco de gás e gelo de verdade. A gente tirou o facão da história.
          </p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {badges.map((b, i) => (
              <li
                key={b}
                style={{ rotate: `${[-2, 1.5, -1][i]}deg` }}
                className={`${board} bg-casca px-4 py-2 font-semibold text-fibra shadow-[2px_3px_0_#3A2A1D]`}>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className={`${board} relative grid aspect-square place-items-center bg-isopor`}>
          <CocoSymbol className="w-3/5" />
          <p className="absolute bottom-4 text-sm text-fibra/70">Aqui entra o coco 3D</p>
        </div>
      </section>

      {/* Brand statement */}
      <section style={{ backgroundImage: grain }} className="bg-fibra px-5 py-24 text-polpa sm:px-8">
        <p style={{ fontFamily: display }} className="mx-auto max-w-5xl text-[clamp(2.25rem,6.5vw,5rem)] leading-[1.05]">
          Dentro da lata: coco e{" "}
          <span className={`${board} inline-block -rotate-1 bg-letreiro px-3 pb-1 text-polpa`}>
            <RotatingWord />
          </span>
        </p>
      </section>

      {/* Flavours */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <h2 style={{ fontFamily: display }} className="text-4xl sm:text-5xl">
          Tem fruta, mas quem manda é o coco.
        </h2>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {flavours.map((f, i) => (
            <li
              key={f.name}
              style={{ background: f.accent, color: f.ink, rotate: `${[-0.6, 0.4, -0.3, 0.5, -0.4, 0.3][i]}deg` }}
              className={`${board} relative p-6 shadow-[3px_4px_0_#3A2A1D] transition-[rotate] duration-700 ease-out hover:rotate-0`}>
              <h3 style={{ fontFamily: display }} className="text-3xl">
                {f.name}
              </h3>
              <p className="mt-2 min-h-12 leading-snug">{f.line}</p>
              <p className="mt-4 text-sm tabular-nums">
                {f.kcal} kcal, {f.sugar} g de açúcar
              </p>
              <div className="mt-5 flex items-end justify-between">
                <span style={{ fontFamily: display }} className="text-2xl">
                  R$ 6,90
                </span>
                <button
                  type="button"
                  onClick={() => qa.toggle(f.name)}
                  aria-expanded={qa.open === f.name}
                  className={`${board} bg-letreiro px-4 py-2 font-bold text-polpa focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-fibra`}>
                  {qa.added === f.name ? "Na sacola" : "Quero"}
                </button>
              </div>
              {qa.open === f.name && (
                <div className={`${board} absolute inset-x-4 bottom-20 z-10 bg-polpa p-4 text-fibra shadow-[3px_4px_0_#3A2A1D]`}>
                  <fieldset>
                    <legend className="font-semibold">Quantas?</legend>
                    {qa.packs.map((p, k) => (
                      <label key={p.label} className="mt-2 flex cursor-pointer items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <input type="radio" name={`pack-${f.name}`} checked={qa.pack === k} onChange={() => qa.choose(k)} className="accent-letreiro" />
                          {p.label}
                        </span>
                        <span className="tabular-nums">{p.price}</span>
                      </label>
                    ))}
                  </fieldset>
                  <button type="button" onClick={() => qa.confirm(f.name)} className={`${board} mt-4 w-full bg-letreiro py-2 font-bold text-polpa`}>
                    Pôr na sacola
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Spec */}
      <section className="mx-auto max-w-6xl px-5 pb-32 sm:px-8">
        <h2 style={{ fontFamily: display }} className="text-3xl">
          Tintas e letras
        </h2>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <p style={{ fontFamily: display }} className="text-6xl leading-none">
              Aa Çç Ãã Õõ
            </p>
            <p className="text-sm text-fibra/70">Bowlby One, display. Figtree, texto.</p>
            <p className="max-w-prose leading-relaxed">
              Coco, gelo e paciência. Estupidamente gelado, do jeito que a barraca serve. Ação, coração, pão de queijo: acentos sem susto.
            </p>
          </div>
          <ContrastSheet fontFamily={body} />
        </div>
      </section>
    </main>
  );
}
