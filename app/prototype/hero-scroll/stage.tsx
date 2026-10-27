"use client";

// PROTOTYPE: the one R3F scene every variant shares. Client-only (loaded with ssr: false).
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { Rig } from "./rig";
import { Burst, Can, Coconut } from "./scene-objects";

/** A 3D point that a DOM element with `data-anchor="<index>"` in the hero follows on screen. */
export type Anchor = [number, number, number];

type Props = {
  rig: Rig;
  crack: "cap" | "halves";
  anchors?: Anchor[];
};

export default function Stage({ rig, crack, anchors }: Props) {
  return (
    <Canvas camera={{ fov: 35, position: [0, 0, 6] }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
      <CameraRig rig={rig} />
      <hemisphereLight args={["#ffffff", "#3a2a1d", 0.7]} />
      <directionalLight position={[-3, 4, 5]} intensity={2.2} />
      <Environment resolution={128}>
        <Lightformer intensity={2} position={[0, 3, 5]} scale={[8, 2, 1]} />
        <Lightformer intensity={1} position={[-5, 0, 0]} rotation-y={Math.PI / 2} scale={[6, 6, 1]} />
        <Lightformer intensity={1} position={[5, 0, -2]} rotation-y={-Math.PI / 2} scale={[6, 6, 1]} />
      </Environment>
      <Coconut rig={rig} crack={crack} />
      <Can rig={rig} />
      <Burst rig={rig} />
      {anchors && <Anchors rig={rig} anchors={anchors} />}
    </Canvas>
  );
}

function CameraRig({ rig }: { rig: Rig }) {
  useFrame(({ camera }) => {
    const { r, azim, elev, lookY } = rig.cam;
    camera.position.set(
      r * Math.cos(elev) * Math.sin(azim),
      lookY + r * Math.sin(elev),
      r * Math.cos(elev) * Math.cos(azim),
    );
    camera.lookAt(0, lookY, 0);
  });
  return null;
}

/**
 * Projects each anchor to the screen and moves its DOM element there, fading it by
 * `rig.badges[i]`. Plain DOM in the front layer, so it stacks like every other text.
 */
function Anchors({ rig, anchors }: { rig: Rig; anchors: Anchor[] }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, gl, size }) => {
    const hero = gl.domElement.closest("section");
    anchors.forEach((a, i) => {
      const el = hero?.querySelector<HTMLElement>(`[data-anchor="${i}"]`);
      if (!el) return;
      v.set(...a).project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      const k = rig.badges[i];
      el.style.opacity = String(k);
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${0.7 + 0.3 * k}) rotate(${(i - 1) * 5}deg)`;
    });
  });
  return null;
}
