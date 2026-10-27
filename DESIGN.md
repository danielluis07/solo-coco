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
- A Flavour grid of cards: product image on an accent wash, name and a Quick-add button below, and the pack picker expanding inline within the card.

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

### On phones: Estreita

Decided in [How does the hero behave on phones?](https://github.com/danielluis07/solo-coco/issues/11). The prototype is variant P1 on `prototype/hero-scroll` (`variant-p1.tsx`, viewed through `/prototype/hero-scroll/phone`). On portrait phones (below the `sm` breakpoint, 640 px) the Vitrine timeline is kept beat for beat and everything shrinks to fit:

- **Same Beats, same units.** No Beat is shortened, merged or dropped; the table above holds as is.
- **Scroll**: about 6 viewport heights instead of 7.
- **Object**: the coconut is about 60% of the viewport width (desktop scale × 0.73), sitting slightly below centre; the can is scaled down by the same ratio. At the desktop size it would fill about 82% of a 390 px screen and leave the badges no room.
- **Split headlines** go above and below the object instead of into opposite corners: the first line top-left in the back layer, the second right-aligned near the bottom in the front layer. Display sizes are set in `vw` so a line never overflows: about 17vw for "Só o coco." and "Gelado.", 15vw for "Coco, gelo", 11.5vw for "e paciência.".
- **Corner copy** stays in the two bottom corners at about 13 px, each block under half the width.
- **Badges**: 104 px instead of 144 px. They still drift up at staggered times, the outer two in front and overlapping the object's edges, the middle one behind it.
- **Meter** spans the full width (less the 20 px gutters) along the bottom.

### Known trade-off

Because the hero scrubs, a fast scroller compresses the Facão beat and a slow one stretches it. Accepted: the cut is kept short in units and on an expo ease, so it still reads as the sharp beat at normal speeds.

## Performance, loading and runtime fallbacks

Decided in [What are the performance budgets, loading strategy, and failure fallbacks?](https://github.com/danielluis07/solo-coco/issues/14). These are implementation targets, not measured results. The Accessibility policy below takes precedence when it requires Static.

### Measurement and budgets

The primary baseline is a Galaxy A54-class Android phone, cold cache, with 4 Mbps download and 150 ms network latency. Verify desktop and iPhone behavior too. Transfer budgets count compressed bytes delivered over the network; memory budgets concern decoded/runtime resources, not file sizes.

| Measure | Target |
|---------|--------|
| Initial content | Hero poster and readable Copy visible within 2.5 s of navigation |
| Responsiveness | INP at most 200 ms; CLS at most 0.1 |
| Initial transfer | At most 500 KiB, including at most 180 KiB compressed JavaScript |
| Additional deferred Hero transfer | At most 4 MiB total, including at most 350 KiB compressed additional JavaScript; count geometry, textures, decoders and other Hero resources |
| Animation | Target 60 fps; Lite must sustain at least 30 fps while actively animating |
| Hero GPU resources | Estimated at most 64 MiB on mobile / 128 MiB on desktop |
| Total page JavaScript heap | At most 128 MiB on mobile / 256 MiB on desktop in profiling |

Use cold-load and active-scroll profiling to validate these budgets during implementation. GPU-resource memory is an estimate from allocated resources, not a portable browser memory reading. INP and CLS targets follow [Core Web Vitals guidance](https://web.dev/articles/vitals); evaluate field results at the 75th percentile by mobile and desktop when available. Lab checks do not establish field compliance.

### Loading order

- Serve the poster, readable Copy, critical styles and essential fonts first. The Flavour-grid link works immediately; there is no blocking loader.
- Start deferred 3D loading after the poster paints, yielding to visitor input. Keep the poster until a complete first 3D frame is ready.
- Fetch only the plain Só o Coco can label for the Hero. Load Flavour-card images near the grid; they remain renders, not extra WebGL canvases.
- Pause rendering while the Hero is offscreen or the tab is hidden.
- If the visitor has scrolled past before 3D becomes ready, preserve their position and skip the entrance animation. Loading must never pull them back into the Hero.
- When data-saving mode is detectable, skip deferred 3D and keep Static.

### Rendering tiers

| Tier | Behavior |
|------|----------|
| Full | Complete choreography with noise dissolve and particles; pixel ratio capped at 1.5 |
| Lite | Every Beat and the coconut-to-can transformation retained; scale-swap, simpler lighting, fewer particles; pixel ratio capped at 1 |
| Static | Poster and every piece of Copy in normal page flow; no long pinned scroll; Flavour-grid link remains available |

Phones start in Lite; desktops start in Full, subject to the Accessibility policy, data-saving mode, WebGL availability and loading success. The scale-swap remains the initial implementation stage described in ADR 0001; Full's dissolve layers onto it.

After warm-up, two consecutive three-second measurement windows below 30 fps trigger one downgrade: Full to Lite, then Lite to Static if the same condition recurs. Measure only while the Hero is visible, the tab is active and animation is running; idle/offscreen frames do not count. Never automatically upgrade during that visit.

### Failure behavior

- If WebGL cannot start, an essential asset fails, or a complete first 3D frame is unavailable within 12 s of starting deferred Hero loading, keep Static.
- If the WebGL context is lost or an unrecoverable rendering error occurs mid-scroll, switch to Static. Release pinning while preserving the visitor's visible content position.
- No automatic retries during the visit; reloading tries again. No error modal or image-sequence fallback.
- Static preserves all Copy and the Flavour-grid link. If its poster also fails, retain the branded background and text.

## Accessibility

Decided in [How does the page remain accessible with reduced motion, keyboard navigation, and assistive technology?](https://github.com/danielluis07/solo-coco/issues/15). Target WCAG 2.2 AA plus the reduced-motion behavior below. These are acceptance requirements for implementation, not a claim of tested conformance.

### Motion preferences and visitor control

- `prefers-reduced-motion: reduce` selects Static immediately, before deferred 3D loading. Replace Girar, Facão, Selos, Fechar, Virar lata, Lata gira and Saída with the poster and every meaningful piece of Copy in normal page flow. Do not play the entrance, rotation, cap movement, badge drift, transformation, particles or panel reveal, and do not retain the long pinned scroll.
- Disable Lenis/smooth scrolling, rotating-plaque animation and card movement/transitions in Static. State changes remain immediate. Show all three plaque phrases as static text: “Gelado.”, “Sem pressa.” and “Do seu jeito.”
- Provide an early, keyboard-accessible “Desativar animações” control to select Static for the whole page and remember that choice for the visit. Keep “Ver sabores” immediately available in every tier, including while assets load.
- Honor system preference changes during the visit. Entering Static releases pinning and preserves the visible content position and focus; never jump back to the Hero. Keep Static for the remainder of the visit, consistent with the runtime policy against automatic upgrades.

### Reading order and navigation

- Use stable semantic order: Hero → brand statement → Flavour grid → footer, with one main heading, section headings and a heading for each Flavour. Keep every meaningful phrase accessible once, independent of animation progress; reading does not require scrolling through the Beats.
- Treat the decorative 3D canvas, animated text duplicates and changing 000→100 counter as hidden from assistive technology. Preserve meaningful meter labels in the readable Copy. Do not announce scroll progress or move focus as Beats change.
- Preserve the approved anchor destinations: “O coco” goes to the brand statement; “Sabores”, “Ver sabores” and “Escolha seu coco” go to the grid; “Voltar ao topo” goes to the page top. Activation moves to and focuses the destination heading, bypassing the long Hero sequence. Smooth movement is disabled in Static.
- Keyboard order follows reading order. Focus remains visible and unobscured by pinning, headers or card content; decorative layers never receive focus. All product names, descriptions, nutrition, quantity and prices remain available without hover, animation or waiting for 3D.

### Quick-add

- Quick-add remains a decorative pack/price picker, with the fictional-project disclosure visible before interaction. It does not purchase anything.
- “Escolher” expands a labelled inline picker within its Flavour card and focuses the currently selected native radio option. Use the existing “Quantas latas?” label and 1/6/12-can options, with native keyboard operation and a clear focus outline.
- Selecting a different option updates the card quantity and price, closes the picker and returns focus to that card's “Escolher” button. Announce the resulting quantity and price once through a polite status message; do not announce a purchase confirmation. “Escape” or “Fechar” closes without changing the selection and returns focus to the same button.
- The picker is not a modal and does not trap focus. Product information stays visible when it opens; access never depends on card hover. Reduced motion removes transitions without removing any controls or selection behavior.

### Acceptance checks

- Verify the complete page using keyboard alone and with screen readers: stable headings/reading order, no duplicate animated Copy, correct anchor focus, all six Flavours and every pack option accessible, and one selection announcement per change.
- Verify visible, unobscured focus, existing contrast rules, readable layout at 200% zoom and reflow at 320 CSS-pixel width.
- Test reduced motion at initial navigation and when enabled midway through the pinned Hero; also test “Desativar animações” midway through it. Check that pinning and smoothing stop, content position/focus are preserved, all Copy remains available and grid access stays immediate.

## Statement and product interactions

Decided in [How do the rotating statement, Flavour cards, and Quick-add respond to interaction?](https://github.com/danielluis07/solo-coco/issues/16). The Accessibility policy above continues to govern Static, focus, native radio operation and announcements. These are planning requirements, not implemented behavior.

### Rotating statement

- In normal motion, begin the pinned statement sequence when the dark panel fully covers the Hero. Add 200 viewport-heights of scroll on desktop and 150 on phones. If the section's content exceeds the available viewport, leave it unpinned so all content remains reachable.
- Keep “Coco.”, the body Copy and the Flavour-grid link visible throughout. The Letreiro plaque stays fixed while its Polpa phrases slide upward inside it, without bounce. Reverse the sequence when scrolling upward; use about 0.4 s of catch-up smoothing.
- GSAP owns the scroll-linked sequence. Timeline percentages below refer to the statement's own scroll range, separate from the Hero's seven Beats.

| Range | Plaque behavior |
|-------|-----------------|
| 0–25% | Hold “Gelado.” |
| 25–35% | Slide upward to “Sem pressa.” |
| 35–65% | Hold “Sem pressa.” |
| 65–75% | Slide upward to “Do seu jeito.” |
| 75–100% | Hold “Do seu jeito.”, then release pinning |

- Static shows all three phrases in normal flow, with no plaque movement or statement pinning.

### Flavour cards

- Keep each painted card's small resting tilt. On pointer hover or focus within, straighten to 0° over 240 ms using Tailwind/CSS transitions. Preserve the hard Fibra shadow; add no extra can movement or image swap.
- All product information and controls remain visible. Touch operates the visible controls directly, without a first-tap preview.
- In Static, cards remain untilted and state changes have no transitions.

### Quick-add layout and state

- Expand the inline picker below the card's selected quantity/price and “Escolher” button, keeping product details visible. Use a Polpa inset board with Fibra text on desktop and phones.
- Show “Quantas latas?”, three full-width stacked native radio rows with the approved complete quantity/price labels, “Só pra imaginar sua geladeira.” and “Fechar”. Controls have a minimum height of 44 px.
- Reflow content immediately on expansion; in normal motion, fade the revealed content in over 180 ms using Tailwind/CSS. Static has no fade. Preserve the Accessibility policy's opening focus, selection, Escape/Fechar and single-announcement behavior.
- Keep each Flavour's pack selection independently in memory for the current page instance. Scrolling and motion-tier changes preserve selections; reload resets each card to “1 lata · R$ 6,90”.
- At most one picker is open. Opening another closes the previous picker without changing its selection. Clicking outside closes without stealing focus from the clicked target; tabbing outside closes without moving focus.
- Activating the already-selected option closes the picker and returns focus to “Escolher”, without a change announcement. There is no purchase confirmation.

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

## SEO, sharing preview and favicon

Approved in [What are the SEO metadata, sharing preview, and favicon?](https://github.com/danielluis07/solo-coco/issues/17#issuecomment-6455094227).

- **Page and social title**: “SoloCoco — Só o coco.”
- **Meta and social description**: “Bebida de coco levemente gaseificada, com seis sabores e jeito de barraca. SoloCoco é uma marca fictícia. Nenhuma compra é realizada.”
- **Language and identity**: document `pt-BR`, Open Graph `pt_BR`, site name `SoloCoco`, Open Graph type `website`.
- **Sharing image**: one static 1200 × 630 image for Open Graph and large-image social cards. Polpa background with subtle painted-board grain; approved wordmark and “Só o coco.” on the left; large render of the approved plain Só o Coco can on the right, with a hard Fibra shadow. Include a small, readable “Marca fictícia.” disclosure and keep content comfortably inside the edges.
- **Image alternative text**: “SoloCoco — Só o coco. Lata do sabor Só o Coco sobre fundo claro, com sombra marrom. Marca fictícia.”
- **Favicon and icons**: approved machete-cut coconut symbol alone, solid Fibra on a Polpa square with generous padding. Preserve the angled notch at small sizes; omit grain, shadows and lettering. Use the same treatment for browser and home-screen icons.
- **Deployment-dependent values**: wait for the production URL before setting the canonical URL, `og:url`, absolute sharing-image URL and sitemap URLs. Allow production indexing; keep preview deployments out of search.
- **Structured data**: no JSON-LD initially. Do not mark illustrative prices, stock, ratings or the fictional brand as real commerce data. Footer Copy remains as previously approved.
