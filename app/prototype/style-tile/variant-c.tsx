"use client";

// PROTOTYPE variant C, "Cardápio": the stand's menu board. Heavy Fibra bands with dry-fibre
// grain, all-caps Bungee sign lettering, round price stickers, Flavours as a menu list.
// Bungee + Figtree.
import { ContrastSheet, CocoSymbol, fibre, RotatingWord, useQuickAdd, Wordmark } from "./shared";
import { badges, flavours } from "./tokens";

const display = "var(--font-bungee)";
const body = "var(--font-figtree)";

export const name = "Cardápio";

export function VariantC() {
  const qa = useQuickAdd();
  return (
    <main style={{ fontFamily: body }} className="bg-polpa text-fibra">
      {/* Hero: a sign board across the top, the coconut sitting under it */}
      <section style={{ backgroundImage: fibre }} className="bg-fibra px-5 pt-6 pb-16 text-polpa sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Wordmark className="text-xl" color="#FAFAF5" />
          <span className="text-sm text-polpa/70">Aberto todo dia</span>
        </div>
        <h1 style={{ fontFamily: display }} className="mx-auto mt-14 max-w-6xl text-[clamp(3.25rem,13vw,10.5rem)] leading-[0.88] text-casca">
          Só o
          <br />
          coco.
        </h1>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-10 md:grid-cols-[1fr_auto]">
        <div className="relative grid aspect-[16/10] place-items-center rounded-3xl border-2 border-dashed border-fibra/25">
          <CocoSymbol className="w-1/3" />
          <p className="absolute bottom-4 text-sm text-fibra/70">Aqui entra o coco 3D</p>
        </div>
        <ul className="flex flex-row flex-wrap justify-center gap-4 md:flex-col">
          {badges.map((b, i) => (
            <li
              key={b}
              style={{ rotate: `${[-8, 5, -3][i]}deg` }}
              className="grid size-32 place-items-center rounded-full border-4 border-double border-fibra bg-polpa p-3 text-center text-sm leading-tight font-bold">
              {b}
            </li>
          ))}
        </ul>
      </section>

      {/* Brand statement */}
      <section style={{ backgroundImage: fibre }} className="bg-fibra px-5 py-24 text-polpa sm:px-10">
        <p className="mx-auto max-w-6xl text-xl">Dentro da lata: coco e</p>
        <p style={{ fontFamily: display }} className="mx-auto mt-2 max-w-6xl text-[clamp(2.5rem,9vw,7rem)] leading-none text-polpa">
          <span className="text-casca">
            <RotatingWord />
          </span>
        </p>
      </section>

      {/* Flavours: the menu board */}
      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-10">
        <h2 style={{ fontFamily: display }} className="text-3xl sm:text-4xl">
          Coco gelado
        </h2>
        <p className="mt-2">Seis sabores, um preço. Tem fruta, mas quem manda é o coco.</p>
        <ul className="mt-10 border-t-2 border-fibra">
          {flavours.map((f) => {
            const open = qa.open === f.name;
            return (
              <li key={f.name} className="group border-b border-fibra/25">
                <div className="relative flex items-center gap-4 py-5">
                  <span
                    aria-hidden="true"
                    style={{ background: f.accent }}
                    className="absolute inset-y-0 -left-3 -right-3 -z-0 origin-left scale-x-0 rounded-xl opacity-25 transition-transform duration-700 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
                  />
                  <span style={{ background: f.accent }} className="relative size-6 shrink-0 rounded-full ring-2 ring-fibra" />
                  <div className="relative min-w-0 flex-1">
                    <h3 style={{ fontFamily: display }} className="text-xl sm:text-2xl">
                      {f.name}
                    </h3>
                    <p className="text-sm">
                      {f.line} <span className="text-fibra/70 tabular-nums">{f.kcal} kcal, {f.sugar} g de açúcar.</span>
                    </p>
                  </div>
                  <span style={{ fontFamily: display }} className="relative text-lg tabular-nums">
                    6,90
                  </span>
                  <button
                    type="button"
                    onClick={() => qa.toggle(f.name)}
                    aria-expanded={open}
                    className="relative rounded-full bg-letreiro px-4 py-2 text-sm font-bold text-polpa focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fibra">
                    {qa.added === f.name ? "Na sacola" : open ? "Fechar" : "Quero"}
                  </button>
                </div>
                {open && (
                  <div className="flex flex-wrap items-center gap-3 pb-5 pl-10">
                    {qa.packs.map((p, k) => (
                      <button
                        key={p.label}
                        type="button"
                        aria-pressed={qa.pack === k}
                        onClick={() => qa.choose(k)}
                        className={`rounded-full border-2 border-fibra px-4 py-1.5 text-sm tabular-nums ${qa.pack === k ? "bg-fibra text-polpa" : ""}`}>
                        {p.label}, {p.price}
                      </button>
                    ))}
                    <button type="button" onClick={() => qa.confirm(f.name)} className="rounded-full bg-letreiro px-4 py-1.5 text-sm font-bold text-polpa">
                      Pôr na sacola
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Spec */}
      <section className="mx-auto max-w-6xl px-5 pb-32 sm:px-10">
        <h2 style={{ fontFamily: display }} className="text-2xl">
          Tintas e letras
        </h2>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p style={{ fontFamily: display }} className="text-5xl leading-none">
              Aa Çç Ãã Õõ
            </p>
            <p className="mt-3 text-sm text-fibra/70">Bungee, display (só caixa alta). Figtree, texto.</p>
            <p className="mt-4 max-w-prose leading-relaxed">
              Coco, gelo e paciência. Estupidamente gelado, do jeito que a barraca serve. Ação, coração, pão de queijo: acentos sem susto.
            </p>
          </div>
          <ContrastSheet fontFamily={body} />
        </div>
      </section>
    </main>
  );
}
