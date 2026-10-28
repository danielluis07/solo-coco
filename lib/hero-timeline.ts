// The Hero's master timeline, in units 0–100, and its entrance. Both write to a
// plain rig that the 3D scene reads every frame, so scrolling never re-renders React.
// Rules live in DESIGN.md § Hero choreography; the reference timeline is
// `variant-a.tsx` on the `prototype/hero-scroll` branch. The intro Copy settles in
// with CSS from the first paint, so the entrance moves only the coconut.

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

/** Which meter label a count shows: “Coco inteiro”, “Chacoalhando”, then “Na lata” once it is full. */
export function meterStage(count: number) {
  return count < 20 ? 0 : count < 99 ? 1 : 2;
}

/** A paused timeline whose time is the Hero's units; scroll drives it. */
export function buildHeroTimeline(rig: HeroRig) {
  const { coconut, cap, can, copy, badges, meter, panel } = rig;
  return (
    gsap
      .timeline({ paused: true, defaults: { ease: "none" } })
      // Girar: about 1¼ slow turns with a slight forward tilt.
      .to(coconut, { rotY: stage.coconut.rotY + Math.PI * 2.5, rotX: 0.12, duration: 20, ease: "sine.inOut" }, 0)
      // The intro headline, the corner copy and the call to action leave upwards from about 8.
      .to(copy.intro, { at: 2, duration: 6, stagger: 1, ease: "power1.in" }, 8)
      // Facão: the coconut tilts to show the flesh and coconut water, and the cap cracks
      // open. It pries off slowly, then speeds up out of frame, so most of the scroll
      // goes to the part the visitor can see.
      .to(coconut, { rotX: 0.45, duration: 6, ease: "power2.inOut" }, 19)
      .to(cap, { lift: 1, duration: 17, ease: "power2.in" }, 21)
      // The second headline arrives split across the layers, around the open coconut.
      .to(copy.opened, { at: 1, duration: 6, stagger: 1.5, ease: "power2.out" }, 24)
      // Selos: the badges drift up past the open coconut, one after another.
      .to(badges, { drift: 1, duration: 13, stagger: 2.5 }, 38)
      .to(copy.opened, { at: 2, duration: 6, stagger: 1, ease: "power1.in" }, 46)
      // Fechar: the cap comes back and the coconut levels out.
      .to(cap, { lift: 0, duration: 6, ease: "power2.inOut" }, 56)
      .to(coconut, { rotX: 0, duration: 6, ease: "power2.inOut" }, 56)
      // Virar lata: the meter counts the transformation from 59 to 78, full as the can settles.
      .to(meter, { at: 1, duration: 1.5 }, 59)
      .to(meter, { count: 100, duration: 15 }, 60)
      .to(meter, { at: 2, duration: 1.5 }, 76.5)
      // Shake, spin, and the scale-swap to the can behind the particle burst; the can counter-spins to its front.
      .to(rig, { shake: 1, duration: 5, ease: "power1.in" }, 62)
      .to(coconut, { rotY: `+=${Math.PI * 2}`, duration: 6, ease: "power2.in" }, 63)
      .to(rig, { burst: 1, duration: 8 }, 66)
      .to(rig, { shake: 0, duration: 1 }, 68)
      .to(coconut, { scale: 0, duration: 1 }, 68)
      .to(can, { scale: stage.can.scale, rotY: 0, duration: 6, ease: "power3.out" }, 68.5)
      // Lata gira: a headline arrives, and the can turns through 180° to its back label
      // under the short body line in the opposite corner.
      .to(copy.closing[0], { at: 1, duration: 5, ease: "power2.out" }, 75)
      .to(can, { rotY: Math.PI, duration: 16, ease: "sine.inOut" }, 76)
      .to(copy.closing[1], { at: 1, duration: 4, ease: "power2.out" }, 80)
      // Saída: the brand statement's Fibra panel rises over the can, wiping the frame away onto it.
      .to(panel, { rise: 1, duration: 8, ease: "power2.inOut" }, 92)
  );
}
