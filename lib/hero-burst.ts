// The particle burst that hides the coconut becoming the can in Virar lata:
// fibres, husk chips and coconut-water droplets thrown out from the object and
// falling away. One instanced mesh, posed from the rig's `burst` (0–1).
// Rules live in DESIGN.md § Hero choreography (Virar lata) and § Rendering tiers.

import { Color, IcosahedronGeometry, InstancedMesh, MeshStandardMaterial, Object3D, Vector3 } from "three";

/** Each kind's colour and size (width, length) in scene units, at the coconut's scale. */
const kinds = [
  { name: "fibre", color: "#b98a55", size: [0.05, 0.46] },
  { name: "chip", color: "#5e3b22", size: [0.15, 0.1] },
  { name: "droplet", color: "#eaf3f6", size: [0.1, 0.1] },
] as const;

/** Where the particles start (the coconut's surface) and how far they fly, in scene units. */
const reach = { from: 1.2, near: 1.6, far: 4, fall: 1.2 };

/**
 * Particles leave one after another over the first part of the burst, each flying for
 * the rest of it, so a dense shell keeps forming around the object while it swaps.
 */
const launch = { earliest: 0.05, latest: 0.4, flight: 0.6 };

/** Share of particles thrown towards the camera, where they can cover the swap. */
const towardsCamera = 0.75;

/** A small, seeded generator, so every visit throws the same burst. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type HeroBurst = {
  mesh: InstancedMesh;
  /** Poses every particle for a burst of 0 (not thrown) to 1 (gone). */
  pose: (burst: number) => void;
  dispose: () => void;
};

export function createBurst(count: number): HeroBurst {
  const random = mulberry32(7);
  const seeds = Array.from({ length: count }, (_, i) => ({
    direction: new Vector3(random() * 2 - 1, random() * 2 - 1, (random() < towardsCamera ? 1 : -1) * random()).normalize(),
    distance: reach.near + random() * (reach.far - reach.near),
    kind: kinds[i % kinds.length],
    size: 0.6 + random() * 0.8,
    spin: [random() * 6, random() * 6] as const,
    leaves: launch.earliest + random() * (launch.latest - launch.earliest),
  }));

  const geometry = new IcosahedronGeometry(1, 0);
  const material = new MeshStandardMaterial({ roughness: 0.6, flatShading: true });
  const mesh = new InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  seeds.forEach((seed, i) => mesh.setColorAt(i, new Color(seed.kind.color)));
  const particle = new Object3D();

  const pose = (burst: number) => {
    mesh.visible = burst > 0.001 && burst < 0.999;
    if (!mesh.visible) return;
    seeds.forEach((seed, i) => {
      // Thrown fast, then slowing as it falls; at full size as it leaves the surface,
      // shrinking away by the end of its flight.
      const flight = Math.min(Math.max((burst - seed.leaves) / launch.flight, 0), 1);
      const out = 1 - (1 - flight) ** 3;
      const grow = flight === 0 ? 0 : Math.min(1, flight * 12) * (1 - flight ** 2);
      particle.position.copy(seed.direction).multiplyScalar(reach.from + out * seed.distance);
      particle.position.y -= out * out * reach.fall;
      particle.rotation.set(seed.spin[0] + flight * 6, seed.spin[1] + flight * 4, 0);
      const [width, length] = seed.kind.size;
      particle.scale.set(width, length, width).multiplyScalar(grow * seed.size);
      particle.updateMatrix();
      mesh.setMatrixAt(i, particle.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  pose(0);

  return {
    mesh,
    pose,
    dispose: () => {
      mesh.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
