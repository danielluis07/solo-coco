// Reads what the Motion-tier policy needs to know from the browser.
// Rules live in DESIGN.md § Performance, loading and runtime fallbacks and
// § Accessibility (Motion preferences and visitor control).

import type { DeviceClass, MotionInputs } from "./motion-tier";

export const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

/** Below Tailwind's `sm` breakpoint the page is laid out for portrait phones. */
const phoneQuery = "(max-width: 639.98px)";

// Visit-scoped: the choice lasts for this tab's visit and no longer.
const optOutKey = "solococo:motion-opt-out";

export function readOptOut(): boolean {
  try {
    return sessionStorage.getItem(optOutKey) === "1";
  } catch {
    return false;
  }
}

export function rememberOptOut() {
  try {
    sessionStorage.setItem(optOutKey, "1");
  } catch {
    // Storage is blocked; the choice still holds until reload.
  }
}

function readDataSaving(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true || matchMedia("(prefers-reduced-data: reduce)").matches;
}

function readDeviceClass(): DeviceClass {
  return matchMedia(phoneQuery).matches ? "phone" : "desktop";
}

function probeWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

export function readMotionInputs(): MotionInputs {
  const reducedMotion = matchMedia(reducedMotionQuery).matches;
  const optedOut = readOptOut();
  const dataSaving = readDataSaving();
  // Skip creating a WebGL context when the page is Static regardless.
  const webgl = !reducedMotion && !optedOut && !dataSaving && probeWebGL();
  return { reducedMotion, optedOut, dataSaving, deviceClass: readDeviceClass(), webgl };
}
