// Loads the Hero's generated models and the Só o Coco label. Resolves when every
// essential asset is decoded and in place; rejects if any of them fails.
// The models come from assets/hero/ (ADR 0002); fetching and decoding stay in here.

import { type Material, type Mesh, type MeshStandardMaterial, type Object3D, type Texture, type WebGLRenderer, SRGBColorSpace } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createHeroLiquid, type HeroLiquid } from "./hero-liquid";

const base = "/hero";

export type HeroAssets = {
  coconut: {
    /** Holds the whole coconut and both halves, sharing the coconut's pose. */
    root: Object3D;
    whole: Object3D;
    /** The cap, pivoted on the crack line. */
    top: Object3D;
    /** The body, holding the coconut water. */
    bottom: Object3D;
    /** The coconut water, sloshing as the body moves. */
    liquid: HeroLiquid;
  };
  /** The can, its Body_Label showing the Só o Coco label. */
  can: Object3D;
  dispose: () => void;
};

function named(root: Object3D, name: string) {
  const node = root.getObjectByName(name);
  if (!node) throw new Error(`Hero asset is missing ${name}`);
  return node;
}

export async function loadHeroAssets(renderer: WebGLRenderer): Promise<HeroAssets> {
  const ktx2 = new KTX2Loader().setTranscoderPath(`${base}/basis/`).detectSupport(renderer);
  const gltf = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  try {
    const [coconut, can, label] = await Promise.all([
      gltf.loadAsync(`${base}/coconut.glb`),
      gltf.loadAsync(`${base}/can.glb`),
      ktx2.loadAsync(`${base}/label-so-o-coco.ktx2`),
    ]);

    // glTF UVs put the image's top row at v = 0, so the label is never flipped.
    label.flipY = false;
    label.colorSpace = SRGBColorSpace;
    let labelled = false;
    can.scene.traverse((node) => {
      const material = (node as Mesh).material as MeshStandardMaterial | undefined;
      if (material?.name === "Body_Label") {
        material.map = label;
        material.needsUpdate = true;
        labelled = true;
      }
    });
    if (!labelled) throw new Error("Hero can has no Body_Label material");

    named(can.scene, "Can");
    const root = coconut.scene;

    return {
      coconut: {
        root,
        whole: named(root, "Coconut"),
        top: named(root, "Coconut_Top"),
        bottom: named(root, "Coconut_Bottom"),
        liquid: createHeroLiquid(named(root, "Liquid") as Mesh),
      },
      can: can.scene,
      dispose: () => disposeAll([coconut.scene, can.scene], label),
    };
  } finally {
    // The transcoder workers are only needed while decoding.
    ktx2.dispose();
  }
}

function disposeAll(roots: Object3D[], ...textures: Texture[]) {
  const materials = new Set<Material>();
  for (const root of roots) {
    root.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      for (const material of [mesh.material].flat()) materials.add(material);
    });
  }
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if ((value as Texture | null)?.isTexture) (value as Texture).dispose();
    }
    material.dispose();
  }
  for (const texture of textures) texture.dispose();
}
