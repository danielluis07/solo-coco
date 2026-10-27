"use client";

// PROTOTYPE variant B, "Isopor": modernist restraint. A strict 12-column grid, wide white
// space, cold Isopor surfaces with condensation; Flavours stand in a row like cans in a cooler.
// Lilita One + Work Sans.
import { ContrastSheet, CocoSymbol, droplets, RotatingWord, useQuickAdd, Wordmark } from "./shared";
import { badges, flavours } from "./tokens";

const display = "var(--font-lilita-one)";
const body = "var(--font-work-sans)";

export const name = "Isopor";

export function VariantB() {
  const qa = useQuickAdd();
  return (
    <main style={{ fontFamily: body }} className="bg-polpa text-fibra">
      <header className="mx-auto grid max-w-7xl grid-cols-12 items-center gap-x-6 px-5 py-8 sm:px-10">
        <Wordmark className="col-span-6 text-xl" color="#4E7A1F" />
        <nav className="col-span-6 flex justify-end gap-6 text-sm">
          <a href="#sabores" className="underline-offset-4 hover:underline">
            Sabores
          </a>
          <a href="#tintas" className="underline-offset-4 hover:underline">
            Tintas e letras
          </a>
        </nav>
      </header>

      {/* Hero: text holds a narrow column, the cold surface takes the rest */}
      <section className="mx-auto grid max-w-7xl grid-cols-12 gap-x-6 gap-y-10 px-5 pt-10 pb-24 sm:px-10">
        <div className="col-span-12 flex flex-col justify-end md:col-span-5">
          <h1 style={{ fontFamily: display }} className="text-[clamp(3rem,7vw,6rem)] leading-[0.95] text-fibra">
            Só o coco.
          </h1>
          <p className="mt-6 max-w-sm leading-relaxed">Coco verde, um pouco de gás, e a lata bem gelada. É isso.</p>
          <dl className="mt-10 max-w-sm divide-y divide-casca/40 border-y border-casca/40">
            {badges.map((b) => (
              <div key={b} className="py-3">
                <dt className="sr-only">Selo</dt>
                <dd className="text-lg">{b}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div
          style={{ backgroundImage: droplets, backgroundSize: "38px 38px, 61px 61px" }}
          className="relative col-span-12 grid aspect-[4/5] place-items-center rounded-[2rem] bg-isopor md:col-span-6 md:col-start-7">
          <CocoSymbol className="w-1/2" />
          <p className="absolute bottom-5 left-6 text-sm text-fibra/70">Aqui entra o coco 3D</p>
        </div>
      </section>

      {/* Brand statement: sentence pinned left, word large across the grid */}
      <section className="bg-fibra px-5 py-28 text-polpa sm:px-10">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-x-6">
          <p className="col-span-12 text-lg md:col-span-3">Dentro da lata: coco e</p>
          <p style={{ fontFamily: display }} className="col-span-12 mt-4 text-[clamp(3.5rem,12vw,10rem)] leading-none text-casca md:col-span-9 md:mt-0">
            <RotatingWord />
          </p>
        </div>
      </section>

      {/* Flavours: a row of tall cans in the cooler */}
      <section id="sabores" className="mx-auto max-w-7xl px-5 py-24 sm:px-10">
        <div className="grid grid-cols-12 gap-x-6">
          <h2 style={{ fontFamily: display }} className="col-span-12 text-4xl md:col-span-5">
            Seis latas. O coco em todas.
          </h2>
          <p className="col-span-12 mt-3 max-w-sm md:col-span-4 md:col-start-9 md:mt-0">
            Mesmo preço pra qualquer sabor: R$ 6,90 a lata, R$ 37,90 o pack de 6, R$ 69,90 o de 12.
          </p>
        </div>
        <ul className="mt-12 flex snap-x gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-6 lg:overflow-visible">
          {flavours.map((f) => (
            <li key={f.name} className="group w-56 shrink-0 snap-start lg:w-auto">
              <div
                style={{ backgroundImage: droplets, backgroundSize: "38px 38px, 61px 61px" }}
                className="grid aspect-[1/2] place-items-center rounded-2xl bg-isopor">
                {/* can silhouette */}
                <div
                  style={{ background: f.accent }}
                  className="h-4/5 w-1/2 rounded-[1.2rem/0.6rem] transition-transform duration-700 ease-out group-hover:-translate-y-2 motion-reduce:transition-none">
                  <div className="mx-auto mt-[40%] h-1/4 w-3/4 rounded-sm bg-polpa/90" />
                </div>
              </div>
              <h3 style={{ fontFamily: display }} className="mt-4 text-2xl">
                {f.name}
              </h3>
              <p className="mt-1 text-sm leading-snug">{f.line}</p>
              <p className="mt-2 text-sm text-fibra/70 tabular-nums">
                {f.kcal} kcal, {f.sugar} g de açúcar
              </p>
              <div role="radiogroup" aria-label={`Pack de ${f.name}`} className="mt-4 grid grid-cols-3 overflow-hidden rounded-full border border-fibra/30 text-xs">
                {qa.packs.map((p, k) => {
                  const on = qa.open === f.name && qa.pack === k;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => {
                        if (qa.open !== f.name) qa.toggle(f.name);
                        qa.choose(k);
                      }}
                      className={`py-2 ${on ? "bg-fibra text-polpa" : "hover:bg-isopor"}`}>
                      {p.label.replace(" latas", "").replace(" lata", "")}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (qa.open !== f.name) qa.toggle(f.name);
                  qa.confirm(f.name);
                }}
                className="mt-2 w-full rounded-full bg-letreiro py-2 text-sm font-semibold text-polpa focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fibra">
                {qa.added === f.name ? "Na sacola" : `Pôr na sacola, ${qa.open === f.name ? qa.packs[qa.pack].price : "R$ 6,90"}`}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Spec */}
      <section id="tintas" className="mx-auto grid max-w-7xl grid-cols-12 gap-x-6 gap-y-8 px-5 pb-32 sm:px-10">
        <div className="col-span-12 md:col-span-4">
          <h2 style={{ fontFamily: display }} className="text-3xl">
            Tintas e letras
          </h2>
          <p style={{ fontFamily: display }} className="mt-6 text-6xl leading-none">
            Aa Çç Ãã Õõ
          </p>
          <p className="mt-3 text-sm text-fibra/70">Lilita One, display. Work Sans, texto.</p>
          <p className="mt-4 max-w-prose leading-relaxed">
            Coco, gelo e paciência. Estupidamente gelado, do jeito que a barraca serve. Ação, coração, pão de queijo: acentos sem susto.
          </p>
        </div>
        <div className="col-span-12 md:col-span-8">
          <ContrastSheet fontFamily={body} />
        </div>
      </section>
    </main>
  );
}
