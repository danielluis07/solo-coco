import { describe, expect, test } from "bun:test";
import {
  initialMotionState,
  motionOutput,
  nextMotionState,
  type MotionEvent,
  type MotionInputs,
  type MotionOutput,
  type Tier,
} from "./motion-tier";

const desktop: MotionInputs = {
  reducedMotion: false,
  optedOut: false,
  dataSaving: false,
  deviceClass: "desktop",
  webgl: true,
};
const phone: MotionInputs = { ...desktop, deviceClass: "phone" };

const started: MotionEvent = { type: "load-started" };
const ready: MotionEvent = { type: "first-frame-ready" };
const low: MotionEvent = { type: "fps-measured", fps: 24 };
const ok: MotionEvent = { type: "fps-measured", fps: 58 };
const atThreshold: MotionEvent = { type: "fps-measured", fps: 30 };

function run(inputs: MotionInputs, events: MotionEvent[]): MotionOutput {
  return motionOutput(events.reduce(nextMotionState, initialMotionState(inputs)));
}

const rank: Record<Tier, number> = { static: 0, lite: 1, full: 2 };

describe("initial tier", () => {
  test.each<[string, MotionInputs, MotionOutput]>([
    ["desktop starts in Full", desktop, { tier: "full", startLoading: true }],
    ["phone starts in Lite", phone, { tier: "lite", startLoading: true }],
    ["reduced motion on desktop", { ...desktop, reducedMotion: true }, { tier: "static", startLoading: false }],
    ["reduced motion on phone", { ...phone, reducedMotion: true }, { tier: "static", startLoading: false }],
    ["opt-out on desktop", { ...desktop, optedOut: true }, { tier: "static", startLoading: false }],
    ["opt-out on phone", { ...phone, optedOut: true }, { tier: "static", startLoading: false }],
    ["data-saving on desktop", { ...desktop, dataSaving: true }, { tier: "static", startLoading: false }],
    ["data-saving on phone", { ...phone, dataSaving: true }, { tier: "static", startLoading: false }],
    ["no WebGL on desktop", { ...desktop, webgl: false }, { tier: "static", startLoading: false }],
    ["no WebGL on phone", { ...phone, webgl: false }, { tier: "static", startLoading: false }],
  ])("%s", (_, inputs, expected) => {
    expect(run(inputs, [])).toEqual(expected);
  });
});

describe("loading", () => {
  test.each<[string, MotionInputs, MotionEvent[], MotionOutput]>([
    ["stops asking to load once started", desktop, [started], { tier: "full", startLoading: false }],
    ["keeps the tier once the first frame is ready", phone, [started, ready], { tier: "lite", startLoading: false }],
    ["ignores a first frame before loading started", desktop, [ready], { tier: "full", startLoading: true }],
    ["ignores the timeout after the first frame", desktop, [started, ready, { type: "load-timed-out" }], { tier: "full", startLoading: false }],
  ])("%s", (_, inputs, events, expected) => {
    expect(run(inputs, events)).toEqual(expected);
  });
});

describe("failures go straight to Static", () => {
  const failures: [string, MotionEvent[]][] = [
    ["essential asset fails while loading", [started, { type: "asset-failed" }]],
    ["12 s timeout while loading", [started, { type: "load-timed-out" }]],
    ["context lost mid-scroll", [started, ready, { type: "render-failed" }]],
    ["unrecoverable error before the first frame", [started, { type: "render-failed" }]],
  ];
  test.each(
    failures.flatMap(([name, events]) =>
      [desktop, phone].map((inputs) => [`${name} (${inputs.deviceClass})`, inputs, events] as const),
    ),
  )("%s", (_, inputs, events) => {
    expect(run(inputs, [...events])).toEqual({ tier: "static", startLoading: false });
  });
});

describe("frame-rate downgrades", () => {
  test.each<[string, MotionInputs, MotionEvent[], Tier]>([
    ["one low window keeps Full", desktop, [started, ready, low], "full"],
    ["two low windows step Full down to Lite", desktop, [started, ready, low, low], "lite"],
    ["three low windows still only reach Lite", desktop, [started, ready, low, low, low], "lite"],
    ["four low windows step Full to Lite, then Lite to Static", desktop, [started, ready, low, low, low, low], "static"],
    ["two low windows step Lite down to Static", phone, [started, ready, low, low], "static"],
    ["a good window resets the count", desktop, [started, ready, low, ok, low], "full"],
    ["exactly 30 fps is not low", desktop, [started, ready, low, atThreshold, low], "full"],
    ["windows before the first frame don't count", desktop, [started, low, low, ready, low], "full"],
  ])("%s", (_, inputs, events, tier) => {
    expect(run(inputs, events).tier).toBe(tier);
  });
});

describe("Static is terminal", () => {
  const recovery: MotionEvent[] = [started, ready, ok, ok, ok];
  test.each<[string, MotionInputs, MotionEvent[]]>([
    ["opt-out mid-visit on desktop", desktop, [started, ready, { type: "opted-out" }]],
    ["opt-out mid-visit on phone", phone, [started, ready, { type: "opted-out" }]],
    ["opt-out while loading", desktop, [started, { type: "opted-out" }]],
    ["reduced motion turned on mid-visit", desktop, [started, ready, { type: "reduced-motion-enabled" }]],
    ["reduced motion turned on before loading", phone, [{ type: "reduced-motion-enabled" }]],
    ["low-fps Static", phone, [started, ready, low, low]],
  ])("%s, then stays Static", (_, inputs, events) => {
    expect(run(inputs, [...events, ...recovery])).toEqual({ tier: "static", startLoading: false });
  });
});

describe("never upgrades", () => {
  // Deterministic PRNG so failures are reproducible.
  function mulberry32(seed: number) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const events: MotionEvent[] = [
    started,
    ready,
    low,
    ok,
    atThreshold,
    { type: "fps-measured", fps: 0 },
    { type: "fps-measured", fps: 120 },
    { type: "asset-failed" },
    { type: "load-timed-out" },
    { type: "render-failed" },
    { type: "reduced-motion-enabled" },
    { type: "opted-out" },
  ];

  test.each([desktop, phone])("random sequences on $deviceClass", (inputs) => {
    const random = mulberry32(inputs.deviceClass === "phone" ? 20 : 18);
    for (let sequence = 0; sequence < 500; sequence++) {
      let state = initialMotionState(inputs);
      for (let i = 0; i < 30; i++) {
        const event = events[Math.floor(random() * events.length)];
        const next = nextMotionState(state, event);
        expect(rank[next.tier]).toBeLessThanOrEqual(rank[state.tier]);
        // Frame rate alone steps down at most one tier at a time.
        if (event.type === "fps-measured") expect(rank[state.tier] - rank[next.tier]).toBeLessThanOrEqual(1);
        if (state.tier === "static") expect(next).toEqual(state);
        state = next;
      }
    }
  });
});
