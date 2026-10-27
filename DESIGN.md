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

How the pinned objects move is decided by [How does the hero scroll sequence move?](https://github.com/danielluis07/solo-coco/issues/8).

### Skin

- **Surfaces**: Polpa with a faint painted-board grain (fractal-noise texture at about 9% Fibra). The dark section uses the same grain.
- **Shapes**: boards with slightly uneven corner radii (for example 18/10/16/8 px), as if cut by hand. Small rotations (±0.3° to ±2°) on badges, cards and plaques; never a perfectly regular grid of tilts.
- **Shadows**: a hard, offset Fibra shadow (about 2–3 px right, 3–4 px down, no blur), like a painted drop shadow. No soft grey shadows.
- **Brush stroke**: a single Letreiro brush underline is allowed under the hero headline; nowhere else.
- **Badges**: Casca plaques with Fibra text and the hard shadow.
- **Rotating word**: Polpa text on a Letreiro plaque in the dark section; the word slides up slowly and holds, static under `prefers-reduced-motion`.
- **Flavour cards**: painted price signs. The Flavour accent fills the card, the name is set in Bowlby One, kcal and açúcar sit in body text, and the Quick-add button is a Letreiro board. A card settles to 0° on hover.
- **Flavour accents are fills only.** Maracujá, Caju, Limão, Goiaba and Só o Coco take Fibra text; Açaí takes Polpa text.

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
