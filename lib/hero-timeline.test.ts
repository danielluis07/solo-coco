import { describe, expect, test } from "bun:test";
import stage from "@/assets/hero/stage.json";
import { createHeroRig } from "./hero-rig";
import { buildHeroTimeline, playEntrance } from "./hero-timeline";

const turn = Math.PI * 2;

/** The rig's plain values to 4 decimals (GSAP rounds to 6), without the cache GSAP attaches. */
const pose = (rig: object) =>
  JSON.parse(
    JSON.stringify(rig, (key, value) =>
      key === "_gsap" ? undefined : typeof value === "number" ? Math.round(value * 1e4) / 1e4 : value,
    ),
  );

function timeline() {
  const rig = createHeroRig();
  return { rig, timeline: buildHeroTimeline(rig) };
}

describe("Hero timeline", () => {
  test("unit 0 is the first frame: the poster's pose, coconut whole, no can", () => {
    const { rig, timeline: t } = timeline();
    t.seek(0);
    expect(rig.coconut.scale).toBe(stage.coconut.scale);
    expect(rig.coconut.rotY).toBe(stage.coconut.rotY);
    expect(rig.coconut.rotX).toBe(0);
    expect(rig.cap.lift).toBe(0);
    expect(rig.can.scale).toBe(0);
  });

  test("runs 100 units", () => {
    expect(timeline().timeline.duration()).toBe(100);
  });

  test("Girar turns the whole coconut about 1¼ turns by unit 20, cap still on", () => {
    const { rig, timeline: t } = timeline();
    t.seek(19);
    expect(rig.coconut.rotY - stage.coconut.rotY).toBeGreaterThan(turn * 1.2);
    expect(rig.coconut.rotY - stage.coconut.rotY).toBeLessThanOrEqual(turn * 1.25);
    expect(rig.cap.lift).toBe(0);
  });

  test("Facão lifts the cap out of frame by unit 25 and tilts the flesh towards the reader", () => {
    const { rig, timeline: t } = timeline();
    t.seek(25);
    expect(rig.cap.lift).toBe(1);
    expect(rig.coconut.rotX).toBeGreaterThan(0.4);
  });

  test("Fechar puts the cap back and levels the coconut by unit 62", () => {
    const { rig, timeline: t } = timeline();
    t.seek(40);
    expect(rig.cap.lift).toBe(1);
    t.seek(62);
    expect(rig.cap.lift).toBe(0);
    expect(rig.coconut.rotX).toBe(0);
  });

  test("Virar lata swaps the coconut for the can, front on, by unit 75", () => {
    const { rig, timeline: t } = timeline();
    t.seek(65);
    expect(rig.shake).toBeGreaterThan(0);
    expect(rig.can.scale).toBe(0);
    t.seek(75);
    expect(rig.coconut.scale).toBe(0);
    expect(rig.shake).toBe(0);
    expect(rig.can.scale).toBe(stage.can.scale);
    expect(rig.can.rotY).toBe(0);
  });

  test("Lata gira turns the can through 180° to its back by unit 92", () => {
    const { rig, timeline: t } = timeline();
    t.seek(92);
    expect(rig.can.rotY).toBeCloseTo(Math.PI, 5);
  });

  test("every Beat plays backwards to the first frame", () => {
    const { rig, timeline: t } = timeline();
    const first = pose(rig);
    for (const unit of [30, 70, 100, 50, 10, 0]) t.seek(unit);
    expect(pose(rig)).toEqual(first);
  });
});

describe("Hero entrance", () => {
  test("rises into place over about 2 s and never touches the coconut's Y rotation", () => {
    const rig = createHeroRig();
    const entrance = playEntrance(rig);
    expect(entrance.duration()).toBeCloseTo(2, 1);
    for (const time of [0, 0.5, 1, 1.5]) {
      entrance.seek(time);
      expect(rig.entrance.y).toBeLessThan(0);
      expect(rig.coconut.rotY).toBe(stage.coconut.rotY);
    }
    entrance.seek(entrance.duration());
    expect(pose(rig.entrance)).toEqual({ y: 0, scale: 1, rotZ: 0 });
    expect(rig.coconut.rotY).toBe(stage.coconut.rotY);
    entrance.kill();
  });

  test("leaves the scrubbed pose alone, so scrolling mid-entrance and back returns to the first frame", () => {
    const rig = createHeroRig();
    const t = buildHeroTimeline(rig);
    const entrance = playEntrance(rig);
    entrance.seek(0.5);
    t.seek(80);
    t.seek(0);
    entrance.seek(entrance.duration());
    expect(pose(rig)).toEqual(pose(createHeroRig()));
    entrance.kill();
  });
});
