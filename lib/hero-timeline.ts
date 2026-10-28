// The Hero's master timeline, in units 0–100, and its entrance. Both write to a
// plain rig that the 3D scene reads every frame, so scrolling never re-renders React.
// Rules live in DESIGN.md § Hero choreography; the reference timeline is
// `variant-a.tsx` on the `prototype/hero-scroll` branch. This is the 3D part only:
// the Beats' text and badges arrive with the full choreography.

import { gsap } from "gsap";
import stage from "@/assets/hero/stage.json";
import type { HeroRig } from "./hero-rig";

/**
 * Plays on load: the coconut rises into place, unhurried. Only the entrance
 * offsets move; the scrubbed timeline owns the Y rotation from scroll 0.
 */
export function playEntrance(rig: HeroRig) {
  return gsap.timeline().from(rig.entrance, { y: -0.6, scale: 0.85, rotZ: -0.12, duration: 2, ease: "power3.out" });
}

/** A paused timeline whose time is the Hero's units; scroll drives it. */
export function buildHeroTimeline(rig: HeroRig) {
  const { coconut, cap, can } = rig;
  return (
    gsap
      .timeline({ paused: true, defaults: { ease: "none" } })
      // Girar: about 1¼ slow turns with a slight forward tilt.
      .to(coconut, { rotY: stage.coconut.rotY + Math.PI * 2.5, rotX: 0.12, duration: 20, ease: "sine.inOut" }, 0)
      // Facão: the one sharp beat. The coconut tilts to show the flesh and the cap lifts out.
      .to(coconut, { rotX: 0.45, duration: 4, ease: "power2.out" }, 19)
      .to(cap, { lift: 1, duration: 3, ease: "expo.out" }, 21)
      // Fechar: the cap comes back and the coconut levels out.
      .to(cap, { lift: 0, duration: 6, ease: "power2.inOut" }, 56)
      .to(coconut, { rotX: 0, duration: 6, ease: "power2.inOut" }, 56)
      // Virar lata: shake, spin, and the scale-swap to the can, which counter-spins to its front.
      .to(rig, { shake: 1, duration: 5, ease: "power1.in" }, 62)
      .to(coconut, { rotY: `+=${Math.PI * 2}`, duration: 6, ease: "power2.in" }, 63)
      .to(rig, { shake: 0, duration: 1 }, 68)
      .to(coconut, { scale: 0, duration: 1 }, 68)
      .to(can, { scale: stage.can.scale, rotY: 0, duration: 6, ease: "power3.out" }, 68.5)
      // Lata gira: the can turns through 180° to its back label.
      .to(can, { rotY: Math.PI, duration: 16, ease: "sine.inOut" }, 76)
      // Saída belongs to the page: the dark panel rises over the can until 100.
      .set({}, {}, 100)
  );
}
