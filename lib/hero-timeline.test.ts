import { describe, expect, test } from "bun:test";
import stage from "@/assets/hero/stage.json";
import { createHeroRig } from "./hero-rig";
import { copy } from "@/content/page";
import { buildHeroTimeline, meterStage, playEntrance } from "./hero-timeline";

const { meterLabels } = copy.hero.transformation;

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

  test("Facão tilts the flesh towards the reader and lifts the cap out of frame by unit 38", () => {
    const { rig, timeline: t } = timeline();
    t.seek(25);
    expect(rig.coconut.rotX).toBeGreaterThan(0.4);
    t.seek(38);
    expect(rig.cap.lift).toBe(1);
  });

  test("Facão opens slowly: the cap has only just cracked off at unit 25 and is still rising at 30", () => {
    const { rig, timeline: t } = timeline();
    t.seek(25);
    expect(rig.cap.lift).toBeGreaterThan(0);
    expect(rig.cap.lift).toBeLessThan(0.1);
    t.seek(30);
    expect(rig.cap.lift).toBeLessThan(0.5);
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

  test("Girar: the intro Copy starts in place and has left upwards by unit 20", () => {
    const { rig, timeline: t } = timeline();
    t.seek(0);
    expect(rig.copy.intro.map((piece) => piece.at)).toEqual([1, 1, 1, 1]);
    t.seek(7);
    expect(rig.copy.intro.map((piece) => piece.at)).toEqual([1, 1, 1, 1]);
    t.seek(20);
    expect(rig.copy.intro.map((piece) => piece.at)).toEqual([2, 2, 2, 2]);
  });

  test("Facão: the split headline arrives while the cap pries off, and leaves from unit 46", () => {
    const { rig, timeline: t } = timeline();
    t.seek(20);
    expect(rig.copy.opened.map((piece) => piece.at)).toEqual([0, 0]);
    t.seek(38);
    expect(rig.copy.opened.map((piece) => piece.at)).toEqual([1, 1]);
    t.seek(46);
    expect(rig.copy.opened.map((piece) => piece.at)).toEqual([1, 1]);
    t.seek(56);
    expect(rig.copy.opened.map((piece) => piece.at)).toEqual([2, 2]);
  });

  test("Selos: the badges drift past one after another while the coconut is open", () => {
    const { rig, timeline: t } = timeline();
    t.seek(37);
    expect(rig.badges.map((badge) => badge.drift)).toEqual([0, 0, 0]);
    t.seek(46);
    const [first, middle, last] = rig.badges.map((badge) => badge.drift);
    expect(first).toBeGreaterThan(middle);
    expect(middle).toBeGreaterThan(last);
    expect(last).toBeGreaterThan(0);
    expect(rig.cap.lift).toBe(1);
    t.seek(56);
    expect(rig.badges.map((badge) => badge.drift)).toEqual([1, 1, 1]);
  });

  test("Virar lata: the meter counts 000 → 100 through its three labels, then goes", () => {
    const { rig, timeline: t } = timeline();
    t.seek(58);
    expect(rig.meter.at).toBe(0);
    const seen: string[] = [];
    for (let unit = 60; unit <= 76; unit += 0.5) {
      t.seek(unit);
      const label = meterLabels[meterStage(rig.meter.count)];
      if (seen.at(-1) !== label) seen.push(label);
    }
    expect(seen).toEqual(["Coco inteiro", "Chacoalhando", "Na lata"]);
    t.seek(62);
    expect(rig.meter.at).toBe(1);
    expect(rig.meter.count).toBeGreaterThan(0);
    t.seek(75);
    expect(rig.meter.count).toBe(100);
    t.seek(80);
    expect(rig.meter.at).toBe(2);
  });

  test("Virar lata: the particle burst is at its thickest while the coconut becomes the can", () => {
    const { rig, timeline: t } = timeline();
    t.seek(65);
    expect(rig.burst).toBe(0);
    // The coconut goes and the can arrives between 68 and 69.
    for (const unit of [68, 68.5, 69]) {
      t.seek(unit);
      expect(rig.burst).toBeGreaterThan(0.2);
      expect(rig.burst).toBeLessThan(0.8);
    }
    t.seek(75);
    expect(rig.burst).toBe(1);
  });

  test("Lata gira: the closing Copy arrives as the can turns", () => {
    const { rig, timeline: t } = timeline();
    t.seek(73);
    expect(rig.copy.closing.map((piece) => piece.at)).toEqual([0, 0]);
    t.seek(86);
    expect(rig.copy.closing.map((piece) => piece.at)).toEqual([1, 1]);
    expect(rig.can.rotY).toBeGreaterThan(0);
    expect(rig.can.rotY).toBeLessThan(Math.PI);
  });

  test("Saída: the Fibra panel rises from unit 92 and covers the frame at 100", () => {
    const { rig, timeline: t } = timeline();
    t.seek(92);
    expect(rig.panel.rise).toBe(0);
    t.seek(96);
    expect(rig.panel.rise).toBeGreaterThan(0);
    t.seek(100);
    expect(rig.panel.rise).toBe(1);
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
