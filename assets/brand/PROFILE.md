# Final asset validation (#28)

The card images are 360 × 520 transparent WebP renders of the Hero's scripted
can, not separate models or AI images. `bun run assets:hero` verifies opaque
can pixels, transparent background pixels, and a ceiling of 80 KiB per card.
All six use a 400 px proximity observer, native lazy loading, a no-JavaScript
fallback and explicit dimensions. Browser coverage in
`tests/e2e/flavour-assets.spec.ts` checks that they are not requested at the
top of the page and decode when their cards approach the viewport.

## Local lab capture

Build and start the production app with `PORT=3100`, then run
`bun run assets:profile`. Override `PROFILE_URL` to target another local server.
The script uses a fresh Chromium context, disabled cache, 393 × 852 mobile
viewport, 4 Mbps download / 150 ms latency and 4× CPU slowdown. It reports
encoded resource bytes and request times before the grid, poster + font ready
time, paint timings, CLS, and the longest observed interaction event while
following the footer’s return-to-top link. The poster + font ready time is an upper bound measured
after DOM readiness; it is not an exact visual paint timestamp.

Desktop CPU slowdown is not a calibrated Galaxy A54. A short interaction trace
does not establish field INP. Local HTTP compression also differs from hosting.

### Recorded run — 2026-10-28

This capture predates the owner's removal of the “Escolher” controls. Rerun
`assets:profile` to measure the current page; the saved numbers remain historical
evidence for the original #28 asset implementation.

`profile-lab.json` contains a production-build capture with all final assets,
after the browser test suite finished (no simultaneous build/render/test job).
First contentful paint was 1.02 s; poster/font readiness was 1.699 s, and the
longest observed interaction event was 192 ms. No flavour image was requested
before approaching the grid. Encoded-body totals grouped by the initial
request burst (255–261 ms) versus idle/deferred requests (from 1.917 s):

| Measure | Recorded | Target |
| --- | --- | --- |
| Initial assets + document | 256.0 KiB | ≤ 500 KiB |
| Initial JavaScript | 148.1 KiB | ≤ 180 KiB |
| Additional deferred resources | 3.20 MiB | ≤ 4 MiB |
| Additional deferred JavaScript, including Basis | 346.0 KiB | ≤ 350 KiB |
| Poster + font readiness upper bound | 1.699 s | ≤ 2.5 s visual completion |
| Longest sampled interaction | 192 ms | ≤ 200 ms INP (separate metric) |
| CLS | 1.084 | ≤ 0.1 |

CLS was **1.084**, above the 0.1 target: this run does **not** pass performance
acceptance. The poster/font readiness upper bound and individual compressed
resource transfers are preserved in the JSON. Image decoding and font readiness
are proxies for visual completion; inspect the filmstrip on the physical device.
Investigate Hero setup/fallback layout shifts in a Performance trace before
signing off the budget criterion. Transfer figures exclude HTTP headers, and
the deferred JS total has only about 4 KiB of headroom.

Validation also completed the asset pipeline (all six cards 11.9–14.5 KiB,
geometry and texture budgets satisfied), production build, lint, TypeScript,
65 unit tests, metadata/smoke coverage, and the 19 affected Flavour/Quick-add
browser tests after correcting the loading timing and allowing navigation's
image downloads to finish before monitoring Quick-add requests.

## Required physical-device pass (pending)

No physical Galaxy A54 is attached to this environment. The issue's manual
performance acceptance criterion remains unverified. On an A54-class Android
phone, use a production build and remote Chrome DevTools, clear site data,
disable cache and throttle to 4 Mbps / 150 ms. Record a cold load and a separate
active-scroll trace through every Hero beat into the six-card grid. Save HAR
and Performance traces, recording phone/browser versions and run conditions.

Check initial transfer ≤ 500 KiB and initial compressed JS ≤ 180 KiB; deferred
Hero transfer ≤ 4 MiB with ≤ 350 KiB extra compressed JS. Classify resources by
the loading boundary and initiator, counting models, KTX textures and Basis
decoders with the deferred Hero. Card transfers belong near the grid, not to
the initial or deferred Hero groups. Confirm poster and readable Copy by
2.5 seconds, CLS ≤ 0.1, and interaction latency ≤ 200 ms while scrolling and
following in-page links. Also check sustained Lite animation ≥ 30 fps, the documented
GPU/heap limits, and desktop/iPhone behaviour. Field INP needs representative
interaction samples; a single lab run cannot prove p75 compliance.
