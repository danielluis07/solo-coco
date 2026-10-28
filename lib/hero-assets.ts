// Loads the Hero's generated models and the Só o Coco label. Resolves when every
// essential asset is decoded and in place; rejects if any of them fails.
// The models come from assets/hero/ (ADR 0002); fetching and decoding stay in here.

import {
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
  type Texture,
  type WebGLRenderer,
  BoxGeometry,
  Color,
  Mesh as ThreeMesh,
  MeshBasicMaterial,
  PMREMGenerator,
  SRGBColorSpace,
  Scene,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const base = "/hero";

/**
 * What the coconut water reflects. Seen from the fixed camera, the tilted liquid mirrors
 * the space above and behind it, so bright bars sit there and its swell bends them into
 * streaks. The grey around them lights it too, so it stays dim enough not to wash out.
 */
const studio = {
  surround: 0x55524e,
  /** Bars as [elevation (degrees), height, brightness], all behind the coconut. */
  bars: [
    [28, 0.5, 5],
    [40, 1.2, 7],
    [55, 0.7, 6],
    [72, 1.6, 4],
  ],
};

/** Prefiltered reflections of the studio, for a glossy material's envMap. */
function studioReflections(renderer: WebGLRenderer) {
  const scene = new Scene();
  scene.background = new Color(studio.surround);
  const geometry = new BoxGeometry(1, 1, 1);
  const materials = studio.bars.map(([elevation, height, brightness]) => {
    const material = new MeshBasicMaterial({ color: new Color().setScalar(brightness) });
    const bar = new ThreeMesh(geometry, material);
    const angle = (elevation * Math.PI) / 180;
    bar.position.set(0, Math.sin(angle) * 6, -Math.cos(angle) * 6);
    bar.lookAt(0, 0, 0);
    bar.scale.set(12, height, 0.1);
    scene.add(bar);
    return material;
  });
  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.02);
  pmrem.dispose();
  geometry.dispose();
  for (const material of materials) material.dispose();
  return target;
}

export type HeroAssets = {
  coconut: {
    /** Holds the whole coconut and both halves, sharing the coconut's pose. */
    root: Object3D;
    whole: Object3D;
    /** The cap, pivoted on the crack line. */
    top: Object3D;
    /** The body, holding the coconut water. */
    bottom: Object3D;
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

    // Only the glossy coconut water reflects: everything else stays lit as the poster was.
    const reflections = studioReflections(renderer);
    root.traverse((node) => {
      const material = (node as Mesh).material as MeshStandardMaterial | undefined;
      if (material?.name === "Liquid") material.envMap = reflections.texture;
    });

    return {
      coconut: {
        root,
        whole: named(root, "Coconut"),
        top: named(root, "Coconut_Top"),
        bottom: named(root, "Coconut_Bottom"),
      },
      can: can.scene,
      dispose: () => {
        disposeAll([coconut.scene, can.scene], label);
        reflections.dispose();
      },
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
