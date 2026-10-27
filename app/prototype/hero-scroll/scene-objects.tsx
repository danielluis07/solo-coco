"use client";
/* eslint-disable react-hooks/immutability -- three.js objects are mutated in place by design. */

// PROTOTYPE: stand-in meshes until the real GLBs exist (ADR 0002). A lathed green coconut that
// can be cut two ways, a plain 350 ml can with a canvas label, and the swap particle burst.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Rig } from "./rig";

const CASCA = "#7BA23F";
const POLPA = "#FAFAF5";
const FIBRA = "#3A2A1D";

/** Height of the machete cut on the coconut's local Y axis (the coconut spans -1.1 to 1.1). */
const CUT_Y = 0.5;

function coconutProfile() {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI;
    const y = -Math.cos(theta) * 1.1;
    let r = Math.sin(theta) * 0.95;
    // Young coconuts taper to a blunt point at the top.
    if (y > 0) r *= 1 - 0.2 * (y / 1.1) ** 1.5;
    points.push(new THREE.Vector2(Math.max(r, 0.0001), y));
  }
  return points;
}

function cutProfile(points: THREE.Vector2[], y: number) {
  const i = points.findIndex((p) => p.y >= y);
  const a = points[i - 1];
  const b = points[i];
  const at = new THREE.Vector2(THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y)), y);
  return { below: [...points.slice(0, i), at], above: [at, ...points.slice(i)], radius: at.x };
}

function canvasTexture(width: number, height: number, draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Top-down slice of a young coconut: green skin, cream husk, thin shell, white flesh. */
function fleshTexture() {
  return canvasTexture(256, 256, (g) => {
    const rings: [number, string][] = [
      [1, "#5f8a2c"],
      [0.95, "#ece4c8"],
      [0.6, "#b89a6a"],
      [0.56, "#fafaf5"],
      [0.32, "#eef2ec"],
    ];
    for (const [f, color] of rings) {
      g.fillStyle = color;
      g.beginPath();
      g.arc(128, 128, 128 * f, 0, Math.PI * 2);
      g.fill();
    }
  });
}

export function Coconut({ rig, crack }: { rig: Rig; crack: "cap" | "halves" }) {
  const group = useRef<THREE.Group>(null!);
  const cap = useRef<THREE.Group>(null!);
  const halfA = useRef<THREE.Group>(null!);
  const halfB = useRef<THREE.Group>(null!);

  const parts = useMemo(() => {
    const profile = coconutProfile();
    const cut = cutProfile(profile, CUT_Y);
    // Cross-section of a half: the full profile outline, with the white flesh cavity inset.
    const rim = [...profile, ...[...profile].reverse().map((p) => new THREE.Vector2(-p.x, p.y))];
    const outline = new THREE.Shape(rim);
    const inner = new THREE.Shape(rim.map((p) => new THREE.Vector2(p.x * 0.62, p.y * 0.72)));
    return {
      whole: new THREE.LatheGeometry(profile, 64),
      body: new THREE.LatheGeometry(cut.below, 64),
      capShell: new THREE.LatheGeometry(cut.above, 64),
      cutDisc: new THREE.CircleGeometry(cut.radius, 64),
      halfA: new THREE.LatheGeometry(profile, 32, 0, Math.PI),
      halfB: new THREE.LatheGeometry(profile, 32, Math.PI, Math.PI),
      section: new THREE.ShapeGeometry(outline, 4),
      sectionInner: new THREE.ShapeGeometry(inner, 4),
    };
  }, []);

  const husk = useMemo(() => new THREE.MeshStandardMaterial({ color: CASCA, roughness: 0.55 }), []);
  const flesh = useMemo(() => new THREE.MeshStandardMaterial({ map: fleshTexture(), roughness: 0.7 }), []);
  const cream = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ece4c8", roughness: 0.8, side: THREE.DoubleSide }),
    [],
  );
  const white = useMemo(
    () => new THREE.MeshStandardMaterial({ color: POLPA, roughness: 0.5, side: THREE.DoubleSide }),
    [],
  );

  useFrame(({ clock }) => {
    const c = rig.coconut;
    const g = group.current;
    g.visible = c.scale > 0.001;
    const t = clock.elapsedTime;
    const shake = rig.shake * 0.05;
    g.position.set(c.x + Math.sin(t * 53) * shake, c.y + Math.sin(t * 41) * shake * 0.6, 0);
    g.rotation.set(c.rotX, c.rotY, c.rotZ + Math.sin(t * 47) * shake * 1.5);
    g.scale.setScalar(Math.max(c.scale, 0.0001));

    if (crack === "cap") {
      const { lift, slide } = rig.cap;
      cap.current.position.set(slide * 3.4, lift * 2.6 + slide * 0.4, lift * 0.3);
      cap.current.rotation.set(-lift * 0.5, 0, -slide * 1.1 + lift * 0.25);
    } else {
      const s = rig.split;
      halfA.current.position.x = s * 0.95;
      halfA.current.rotation.set(0, s * 0.95, -s * 0.15);
      halfB.current.position.x = -s * 0.95;
      halfB.current.rotation.set(0, -s * 0.95, s * 0.15);
    }
  });

  return (
    <group ref={group}>
      {crack === "cap" ? (
        <>
          <mesh geometry={parts.body} material={husk} />
          <mesh geometry={parts.cutDisc} material={flesh} position-y={CUT_Y} rotation-x={-Math.PI / 2} />
          <group ref={cap}>
            <mesh geometry={parts.capShell} material={husk} />
            <mesh geometry={parts.cutDisc} material={flesh} position-y={CUT_Y} rotation-x={Math.PI / 2} />
          </group>
        </>
      ) : (
        <>
          <group ref={halfA}>
            <mesh geometry={parts.halfA} material={husk} />
            <group rotation-y={-Math.PI / 2}>
              <mesh geometry={parts.section} material={cream} position-z={0.001} />
              <mesh geometry={parts.sectionInner} material={white} position-z={0.004} />
            </group>
          </group>
          <group ref={halfB}>
            <mesh geometry={parts.halfB} material={husk} />
            <group rotation-y={Math.PI / 2}>
              <mesh geometry={parts.section} material={cream} position-z={0.001} />
              <mesh geometry={parts.sectionInner} material={white} position-z={0.004} />
            </group>
          </group>
        </>
      )}
    </group>
  );
}

function fontVar(el: HTMLElement, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

/** Só o Coco label: a Polpa board on a Casca can, front at u=0.5, back info at the seam. */
function drawLabel(g: CanvasRenderingContext2D, display: string, body: string) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.fillStyle = CASCA;
  g.fillRect(0, 0, W, H);

  g.fillStyle = POLPA;
  g.beginPath();
  g.roundRect(W / 2 - 190, 64, 380, 384, [36, 20, 32, 16]);
  g.fill();

  g.textAlign = "center";
  g.fillStyle = CASCA;
  g.save();
  g.translate(W / 2, 190);
  g.rotate(-0.035);
  g.font = `96px ${display}`;
  g.fillText("Solo", 0, 0);
  g.fillText("Coco", 0, 92);
  g.restore();

  g.fillStyle = FIBRA;
  g.font = `600 30px ${body}`;
  g.fillText("Só o coco.", W / 2, 340);
  g.font = `500 22px ${body}`;
  g.fillText("levemente gaseificado · 350 ml", W / 2, 410);

  // Back panel, drawn on both edges so it wraps across the seam.
  for (const x of [0, W]) {
    g.font = `40px ${display}`;
    g.fillText("Coco, gelo", x, 190);
    g.fillText("e paciência.", x, 236);
    g.font = `500 22px ${body}`;
    g.fillText("água de coco, polpa de coco", x, 300);
    g.fillText("e gás. Mais nada.", x, 330);
    g.fillText("35 kcal · 3 g açúcar", x, 380);
  }
}

export function Can({ rig }: { rig: Rig }) {
  const group = useRef<THREE.Group>(null!);
  const gl = useThree((s) => s.gl);
  const label = useMemo(() => canvasTexture(1024, 512, () => {}), []);

  useEffect(() => {
    const redraw = () => {
      const g = (label.image as HTMLCanvasElement).getContext("2d")!;
      drawLabel(
        g,
        fontVar(gl.domElement, "--font-bowlby-one", "Impact"),
        fontVar(gl.domElement, "--font-figtree", "sans-serif"),
      );
      label.needsUpdate = true;
    };
    redraw();
    document.fonts.ready.then(redraw);
  }, [gl, label]);

  useFrame(() => {
    const c = rig.can;
    const g = group.current;
    g.visible = c.scale > 0.001;
    g.position.y = c.y;
    g.rotation.set(c.rotX, c.rotY, 0);
    g.scale.setScalar(Math.max(c.scale, 0.0001));
  });

  return (
    <group ref={group}>
      <mesh>
        <cylinderGeometry args={[0.55, 0.55, 1.9, 96, 1, true, -Math.PI, Math.PI * 2]} />
        <meshStandardMaterial map={label} roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position-y={1.01}>
        <cylinderGeometry args={[0.46, 0.55, 0.12, 96]} />
        <meshStandardMaterial color="#c9ced1" roughness={0.25} metalness={0.9} />
      </mesh>
      <mesh position-y={-0.99}>
        <cylinderGeometry args={[0.55, 0.48, 0.08, 96]} />
        <meshStandardMaterial color="#c9ced1" roughness={0.25} metalness={0.9} />
      </mesh>
    </group>
  );
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BURST_COUNT = 160;

/** Fibres, husk chips and droplets thrown out while the coconut becomes the can. */
export function Burst({ rig }: { rig: Rig }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => {
    const rand = mulberry32(7);
    return Array.from({ length: BURST_COUNT }, (_, i) => {
      const dir = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      return {
        dir,
        dist: 1.4 + rand() * 1.8,
        kind: i % 3,
        size: 0.6 + rand() * 0.8,
        rx: rand() * 6,
        ry: rand() * 6,
      };
    });
  }, []);

  useEffect(() => {
    const colors = ["#8a6a3d", CASCA, "#eaf3f6"].map((c) => new THREE.Color(c));
    seeds.forEach((s, i) => mesh.current.setColorAt(i, colors[s.kind]));
    mesh.current.instanceColor!.needsUpdate = true;
  }, [seeds]);

  useFrame(() => {
    const b = rig.burst;
    mesh.current.visible = b > 0.001 && b < 0.999;
    if (!mesh.current.visible) return;
    const out = 1 - (1 - b) ** 3;
    const grow = Math.sin(Math.PI * b);
    seeds.forEach((s, i) => {
      dummy.position.copy(s.dir).multiplyScalar(0.2 + out * s.dist);
      dummy.position.y -= out * out * 0.8;
      dummy.rotation.set(s.rx + b * 6, s.ry + b * 4, 0);
      const [x, y] = s.kind === 0 ? [0.02, 0.2] : s.kind === 1 ? [0.06, 0.04] : [0.045, 0.045];
      dummy.scale.set(x, y, x).multiplyScalar(grow * s.size);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, BURST_COUNT]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.6} />
    </instancedMesh>
  );
}
