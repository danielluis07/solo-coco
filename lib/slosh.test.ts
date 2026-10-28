import { describe, expect, test } from "bun:test";
import { createSlosh, defaultSloshOptions } from "./slosh";

const upright = [0, -1, 0] as const;
/** Gravity in the vessel's frame once it tips `angle` radians towards +z. */
const tipped = (angle: number) => [0, -Math.cos(angle), Math.sin(angle)] as const;

/** Steps at 60 fps for `seconds`; returns the tilt along z after each frame. */
function run(slosh: ReturnType<typeof createSlosh>, seconds: number, down: readonly [number, number, number]) {
  const trace: number[] = [];
  for (let t = 0; t < seconds; t += 1 / 60) {
    slosh.step(1 / 60, down);
    trace.push(slosh.tilt[1]);
  }
  return trace;
}

describe("slosh", () => {
  test("still water in an upright vessel stays still and asks for no frames", () => {
    const slosh = createSlosh();
    expect(slosh.step(1 / 60, upright)).toBe(false);
    expect(slosh.tilt).toEqual([0, 0]);
  });

  test("tipping the vessel rocks the water, which settles leaning partly back", () => {
    const slosh = createSlosh();
    const trace = run(slosh, 2, tipped(0.2));
    const { gravity, maxTilt } = defaultSloshOptions;
    // Partly levelled, easing into the cap.
    const target = maxTilt * Math.tanh((gravity * Math.tan(0.2)) / maxTilt);
    // It overshoots and swings back at least once before settling.
    expect(Math.max(...trace)).toBeGreaterThan(target * 1.3);
    expect(trace.some((value, i) => i > 0 && value < trace[i - 1])).toBe(true);
    run(slosh, 15, tipped(0.2));
    expect(slosh.tilt[1]).toBeCloseTo(target, 3);
    expect(slosh.step(1 / 60, tipped(0.2))).toBe(false);
  });

  test("a steep tip leans the water no further than the cap", () => {
    const slosh = createSlosh();
    run(slosh, 20, tipped(1.2));
    expect(slosh.tilt[1]).toBeLessThanOrEqual(defaultSloshOptions.maxTilt);
    expect(slosh.tilt[1]).toBeGreaterThan(defaultSloshOptions.maxTilt * 0.9);
  });

  test("a jolt heaves and ripples the water, then it settles", () => {
    const slosh = createSlosh();
    slosh.jolt(1);
    expect(slosh.step(1 / 60, upright)).toBe(true);
    expect(Math.abs(slosh.swell)).toBeGreaterThan(0);
    expect(slosh.ripple).toBeGreaterThan(0.5);
    run(slosh, 20, upright);
    expect(slosh.step(1 / 60, upright)).toBe(false);
    expect(slosh.ripple).toBe(0);
  });

  test("a long pause counts as one short frame, so the water never blows up", () => {
    const slosh = createSlosh();
    slosh.step(5, tipped(0.4));
    expect(Math.abs(slosh.tilt[1])).toBeLessThan(1);
    expect(slosh.time).toBeCloseTo(0.1, 5);
  });
});
