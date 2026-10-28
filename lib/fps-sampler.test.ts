import { describe, expect, test } from "bun:test";
import { createFpsSampler } from "./fps-sampler";

/** Ticks every `1000 / fps` ms from `from` for `ms`, active or not; returns the end time. */
function run(sampler: ReturnType<typeof createFpsSampler>, from: number, ms: number, fps: number, active = true) {
  const step = 1000 / fps;
  let now = from;
  for (; now < from + ms; now += step) sampler.tick(now, active);
  return now;
}

function sampler(warmUpMs = 0) {
  const windows: number[] = [];
  return { windows, sampler: createFpsSampler({ warmUpMs, onWindow: (fps) => windows.push(fps) }) };
}

describe("fps sampler", () => {
  test("reports the average fps of each 3-second window of animation", () => {
    const { windows, sampler: s } = sampler();
    run(s, 0, 3_100, 60);
    expect(windows).toHaveLength(1);
    expect(windows[0]).toBeCloseTo(60, 0);
  });

  test("counts only active time: idle, offscreen or hidden stretches neither count nor break a window", () => {
    const { windows, sampler: s } = sampler();
    let now = run(s, 0, 2_000, 60);
    // Ten idle seconds, as when the visitor stops scrolling or the tab is hidden.
    now = run(s, now, 10_000, 60, false);
    expect(windows).toHaveLength(0);
    run(s, now, 1_100, 60);
    expect(windows).toHaveLength(1);
    expect(windows[0]).toBeCloseTo(60, 0);
  });

  test("reports slow animation as a low window", () => {
    const { windows, sampler: s } = sampler();
    run(s, 0, 6_100, 20);
    expect(windows).toHaveLength(2);
    expect(windows[0]).toBeCloseTo(20, 0);
    expect(windows[1]).toBeCloseTo(20, 0);
  });

  test("ignores the warm-up at the start of the animation", () => {
    const { windows, sampler: s } = sampler(1_000);
    // Shader compiles and texture uploads stall the first second.
    const now = run(s, 0, 1_000, 5);
    run(s, now, 3_100, 60);
    expect(windows).toHaveLength(1);
    expect(windows[0]).toBeCloseTo(60, 0);
  });
});
