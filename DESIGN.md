# SoloCoco Design

The brand and visual system for the SoloCoco landing page. Vocabulary lives in `GLOSSARY.md`.

## Brand core

Decided in [What is SoloCoco's brand identity?](https://github.com/danielluis07/solo-coco/issues/4).

### Product and audience

- **Product**: a lightly sparkling coconut drink in a can. Each Flavour is the coconut base plus one Brazilian fruit; coconut is always the lead.
- **Positioning**: an everyday pleasure, not a wellness or functional drink. Stay off the coconut-water shelf look.
- **Audience**: urban Brazilians, roughly 20–35, buying from a padaria, a beach kiosk, or a bar fridge. The brand speaks to Brazilians, so it never explains Brazil.

### Name and tagline

- **SoloCoco** plays on *só o coco*: "just coconut". Coconut is the star; fruit is the accent.
- **Tagline**: "Só o coco." (with the period). Flat, calm, declarative.

### Personality

**Relaxed confidence.** Unhurried, warm, dry-witted: the friend at the beach kiosk who never oversells. Humour comes from understatement, never from exclamation.

### The Brazilian angle

One specific source: **the roadside coconut stand**. Hand-painted *letreiros* ("COCO GELADO"), the *abridores de letras* sign-painting tradition, styrofoam coolers, the machete cut, the green coconut itself.

Borrow the *restraint* of Brazilian modernism for the layout grid so the vernacular never tips into kitsch.

**Never**: flag green-and-yellow, samba, the Copacabana wave pavement, toucans, generic "tropical" leaf patterns, palm trees, sunsets.

### Voice and tone (pt-BR)

- Address the reader as *você*; when the brand speaks of itself, *a gente*, never "a marca".
- Short sentences, plain verbs, understatement. Exclamation marks almost never.
- Neutral, everyday Brazilian Portuguese; beach-kiosk vocabulary where it fits (*gelado*, *estupidamente gelado*, *canudo*, *barraca*).
- No dated slang, no English loanwords, no wellness jargon ("hidratação funcional").
- Rule of thumb: write like a good kiosk sign. Short, sure, never begging.
- Samples:
  - "Coco, gelo e paciência."
  - "A gente tirou o facão da história."
  - "Tem fruta, mas quem manda é o coco."

### Palette (base tokens)

Checked for contrast in the style tile ([What should the visual direction look like?](https://github.com/danielluis07/solo-coco/issues/7)). Flavour colours are added by the Flavour lineup.

| Token       | Hex       | Role |
|-------------|-----------|------|
| Casca       | `#7BA23F` | Young green coconut husk. Primary brand colour; yellowish leaf green, not flag green. A fill colour, never text on Polpa. |
| Casca funda | `#4E7A1F` | Deeper husk. Any green text or link on Polpa. |
| Polpa       | `#FAFAF5` | Coconut flesh. Main background; a cool white, not warm cream. |
| Fibra       | `#3A2A1D` | Dry husk fibre. Text, and the dark brand-statement section, in place of near-black. |
| Letreiro    | `#D7261E` | Sign-paint red. Sparing accent: logo accents, Quick-add, one highlight. |
| Isopor      | `#DCE6EA` | The cooler box. Cold grey-blue for surfaces and dividers; a hint of *gelado*. |

#### Contrast rules (WCAG)

| Pairing | Ratio | Use |
|---------|-------|-----|
| Fibra on Polpa | 13.1 | Body text. |
| Casca funda on Polpa | 4.9 | Green text and links. |
| Casca on Polpa | 2.8 | Fails as text. Fills, the symbol and the can only. |
| Fibra on Casca | 4.6 | Text on Casca fills (badges). Never Polpa on Casca (2.8). |
| Polpa on Letreiro | 4.8 | Quick-add buttons, the red plaque. |
| Letreiro on Fibra | 2.7 | Fails as text. In the dark section, red appears only as a plaque behind Polpa text. |
| Polpa on Fibra | 13.1 | Dark-section text. |

The logo is exempt: Casca wordmark on Polpa stays allowed.

### Typography

- **Display**: chunky, slightly irregular, sign-painted character: heavy strokes, tight spacing, a little bounce. Used big and rarely (hero lines, the rotating word, Flavour names).
- **Body**: a plain, friendly humanist sans with solid Latin-extended coverage (ã, ç, õ). The display face carries the personality.
- **Source**: free fonts via `next/font`. Geist (from the scaffold) is replaced.
- **Display: Bowlby One** (400; Google ships the `latin` subset only, which covers ã ç õ é). Set tight (about -0.02em), line-height around 0.9, often on a slight tilt (-1° to -2°) like a painted sign.
- **Body: Figtree** (`latin` + `latin-ext`).
- Lilita One, Bungee and Work Sans were tried in the style tile and dropped.

### Logo direction

- **Wordmark**: "SoloCoco", custom-lettered in the sign-painting style (drawn, not typeset), on a gently lifted baseline like a painted sign. Casca or Fibra on Polpa; Letreiro allowed as a single-colour variant.
- **Symbol**: the top of a green coconut after the machete cut: a round form with one angled notch. Works alone as favicon and on the can, and echoes the hero's crack-open moment.
- Used as a lockup or apart.
- **Never**: straws in coconuts, palm trees, sunsets, letters turned into coconuts.

### Motion personality

**Unhurried.** Long eases, no bounce or springy overshoot. One sharp beat only: the machete-crack. The hero choreography designs the specific moves within this rule.

## Visual direction: Letreiro

Decided in [What should the visual direction look like?](https://github.com/danielluis07/solo-coco/issues/7). The page wears the **Letreiro** skin: SoloCoco as a run of hand-painted kiosk boards. The prototype is on the throwaway branch `prototype/style-tile` (variant A).

### Composition

The page's layout and section sequence follow `demo.mp4` (composition and motion only, never its branding):

- A giant display headline set top-left, short body copy in the opposite corners, small reading blocks rather than full-width paragraphs.
- The coconut, and then the can, sit **centred in the viewport and stay there while the page scrolls**. Text and badges move around them.
- Round stat badges orbit the cracked coconut.
- A dark Fibra brand-statement section with the rotating word on a highlight plaque.
- A Flavour grid of cards: product image on an accent wash, name and a Quick-add button below, and the pack picker opening over the card.

How the pinned objects move is set in § Hero choreography.

### Skin

- **Surfaces**: Polpa with a faint painted-board grain (fractal-noise texture at about 9% Fibra). The dark section uses the same grain.
- **Shapes**: boards with slightly uneven corner radii (for example 18/10/16/8 px), as if cut by hand. Small rotations (±0.3° to ±2°) on badges, cards and plaques; never a perfectly regular grid of tilts.
- **Shadows**: a hard, offset Fibra shadow (about 2–3 px right, 3–4 px down, no blur), like a painted drop shadow. No soft grey shadows.
- **Brush stroke**: a single Letreiro brush underline is allowed under the hero headline; nowhere else.
- **Badges**: Casca plaques with Fibra text and the hard shadow.
- **Rotating word**: Polpa text on a Letreiro plaque in the dark section; the word slides up slowly and holds, static under `prefers-reduced-motion`.
- **Flavour cards**: painted price signs. The Flavour accent fills the card, the name is set in Bowlby One, kcal and açúcar sit in body text, and the Quick-add button is a Letreiro board. A card settles to 0° on hover.
- **Flavour accents are fills only.** Maracujá, Caju, Limão, Goiaba and Só o Coco take Fibra text; Açaí takes Polpa text.

## Hero choreography: Vitrine

Decided in [How does the hero scroll sequence move?](https://github.com/danielluis07/solo-coco/issues/8). The prototype is on the throwaway branch `prototype/hero-scroll` (variant A); its `variant-a.tsx` is the reference timeline.

### Rules

- **Fixed camera.** The camera never moves. The coconut, then the can, stays centred; only the object and the text around it move.
- **Continuous scrub.** One pinned hero section and one master timeline scrubbed by scroll (catch-up smoothing about 1.2 s), about 7 viewport heights long. Every beat plays backwards when scrolling up.
- **Entrance on load, not on scroll.** The coconut rises into place and the intro text settles in time (about 2 s, long ease-out), so the first frame is already composed. The scroll timeline owns the coconut's Y rotation from scroll 0; the entrance never animates it.
- **Three layers.** Text behind the object, the 3D canvas, text in front. A headline can split across them so the object sits between its lines.

### Beats

Positions are in timeline units out of 100.

| Units | Beat | What moves |
|-------|------|------------|
| 0–20 | Girar | The whole coconut turns slowly (about 1¼ turns, sine ease) with a slight forward tilt. The intro headline "Só o coco." (with the brush underline) and the corner copy leave upwards from about 8. |
| 20–25 | Facão | The one sharp beat. The coconut tilts towards the reader so the flesh shows, and the machete cap lifts straight up and out of frame (short segment, expo ease-out). The second headline arrives split across the layers. |
| 25–56 | Selos | The three hero badges drift up past the open coconut at staggered times and slightly different tilts. The middle one passes **behind** the coconut, the other two in front. The headline leaves at about 46. |
| 56–62 | Fechar | The cap comes back down and the coconut levels out (long inOut ease). |
| 62–75 | Virar lata | The coconut shakes, spins one full turn and is hidden by the particle burst (fibres, husk chips, droplets). The can replaces it **in place** with a counter-spin settling to front. A painted meter counts 000 → 100 through "Coco inteiro → Chacoalhando → Na lata" (59–78). |
| 75–92 | Lata gira | A headline arrives top-left, and the can turns slowly through 180° to show its back label, with a short body line in the opposite corner. |
| 92–100 | Saída | The dark Fibra brand-statement panel rises over the can (uneven, hand-cut top edge). The page below continues in the same Fibra, so the hand-off is seamless. |

### Known trade-off

Because the hero scrubs, a fast scroller compresses the Facão beat and a slow one stretches it. Accepted: the cut is kept short in units and on an expo ease, so it still reads as the sharp beat at normal speeds.

## Flavour lineup

Decided in [What is the Flavour lineup?](https://github.com/danielluis07/solo-coco/issues/5).

Six Flavours: the plain coconut one and five fruit ones. Each is named by the fruit alone; no invented product names. In Copy, "SoloCoco Maracujá" on first mention, then "Maracujá".

| Flavour   | Accent    | kcal / 350 ml | Açúcar |
|-----------|-----------|---------------|--------|
| Só o Coco | Polpa label on Casca (no new colour) | 35 | 3 g |
| Maracujá  | `#F2B628` | 48 | 6 g |
| Caju      | `#E8662A` | 50 | 6 g |
| Açaí      | `#5B2A6E` | 52 | 7 g |
| Limão     | `#B5CC3A` | 42 | 4 g |
| Goiaba    | `#EE8FA0` | 55 | 7 g |

- **Accent colours** fill the label, the card wash and the hover state. The style tile kept the hexes as they are; they are fills only, with the text colours set in § Visual direction. Limão stays cooler and yellower than Casca; Goiaba stays soft pink, well away from Letreiro.
- **Can**: one size, 350 ml. The hero can is Só o Coco; the fruit Flavours first appear in the grid.
- **Quick-add**: the same prices for every Flavour. Decorative only.

  | Pack     | Price     |
  |----------|-----------|
  | 1 lata   | R$ 6,90   |
  | 6 latas  | R$ 37,90  |
  | 12 latas | R$ 69,90  |

- **Hero badges**: three shared across all Flavours, deadpan, no wellness claims: "Só 3 ingredientes", "Levemente gaseificado", "Estupidamente gelado".
- **Card stats**: kcal and açúcar on every Flavour card, plus a one-line descriptor in the brand voice. The descriptors are written in the Copy ticket.

## Can label: Barraca

Decided in [What does each Flavour's can label look like?](https://github.com/danielluis07/solo-coco/issues/10). The prototype is on the throwaway branch `prototype/can-label` (variant B); its `label-b.tsx` is the reference layout.

### Strip

- One label image per Flavour, drawn as flat art for the can's single UV strip (ADR 0002): **2048 × 1024**, about the 2:1 wrap of a 350 ml can.
- **Seam on the can's left side** (u = 0 = 1). Front panel centred at u = 0.25, back panel at u = 0.75, so neither the front nor the back shown in "Lata gira" crosses the seam. Each panel reads face-on about ±320 px around its centre.
- The painted-board grain is baked into the texture.

### Shared system

- **Husk**: the top two-thirds of every can is Casca, so the six read as one family and coconut always leads.
- **Flavour band**: the bottom third is the Flavour accent, its top edge a jagged machete cut with a Fibra outline that wraps the whole can and meets itself at the seam. Só o Coco's band is Polpa ("Polpa label on Casca").
- **Front**: the symbol and the wordmark in Fibra on the husk (Fibra on Casca, 4.6), "Levemente gaseificado" under it; a Polpa roundel with the painted fruit sits across the cut; the Flavour name in Bowlby One on the band, in the Flavour's text colour (§ Visual direction); "350 ml" below.
- **Side**: a smaller painted fruit on the band at u = 0.5.
- **Back**: "Só o coco.", the ingredients, and kcal and açúcar per can in Fibra on the husk; "350 ml" and a sign-off on the band. The wording is written in the Copy ticket.
- Wordmark and Flavour name stay inside the front panel: Bowlby One sets about 0.72 em a glyph.

### Fruit art

- **One painted fruit per Flavour**, on the front roundel and repeated small on the side. Só o Coco gets a coconut half.
- **Style**: the fruit on a juice-stand menu board. Flat fills, a thick Fibra outline, one highlight stroke, cut fruit shown in section where it reads better (maracujá, limão, goiaba), whole where the shape is the point (caju with its nut, an açaí cluster).
- **Source**: paid-tier AI images we own the output of (ADR 0002), used as reference and repainted flat to the style above, so the six match.

### Known refinement

The symbol drawn in Fibra on the Casca husk reads as a dark ball at grid size. Its on-husk treatment is refined when the label art is drawn.
