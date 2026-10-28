import { describe, expect, mock, test } from "bun:test";
import type { MotionEvent } from "./motion-tier";
import { guardHeroLoad } from "./hero-load";

const timeoutMs = 30;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function guarded(ready: Promise<void>) {
  const events: MotionEvent["type"][] = [];
  const load = mock(() => ready);
  const guard = guardHeroLoad({ load, timeoutMs, dispatch: (event) => events.push(event.type) });
  return { events, load, guard };
}

describe("Hero load guard", () => {
  test("a first complete frame in time makes the 3D ready", async () => {
    const ready = deferred();
    const { events } = guarded(ready.promise);
    expect(events).toEqual(["load-started"]);
    ready.resolve();
    await wait(timeoutMs * 2);
    expect(events).toEqual(["load-started", "first-frame-ready"]);
  });

  test("an essential asset failure ends the attempt, with no retry", async () => {
    const ready = deferred();
    const { events, load } = guarded(ready.promise);
    ready.reject(new Error("coconut.glb 404"));
    await wait(timeoutMs * 2);
    expect(events).toEqual(["load-started", "asset-failed"]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  test("no first frame within the timeout ends the attempt; a late frame is ignored", async () => {
    const ready = deferred();
    const { events, load } = guarded(ready.promise);
    await wait(timeoutMs * 2);
    expect(events).toEqual(["load-started", "load-timed-out"]);
    ready.resolve();
    await wait(timeoutMs);
    expect(events).toEqual(["load-started", "load-timed-out"]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  test("once cancelled it reports nothing more", async () => {
    const ready = deferred();
    const { events, guard } = guarded(ready.promise);
    guard.cancel();
    await wait(timeoutMs * 2);
    ready.reject(new Error("aborted"));
    await wait(timeoutMs);
    expect(events).toEqual(["load-started"]);
  });
});
