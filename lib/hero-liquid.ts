// The coconut water in the bottom half: a surface that leans, heaves and ripples with
// the slosh (lib/slosh.ts), drawn inside the vessel build_hero.py exports as Liquid.
//
// The vessel is the flesh's hollow up to the highest a slosh may reach. Only its far,
// inside walls are drawn: each fragment finds where its view ray crossed the water's
// surface, so the surface is exact wherever it leans, and shades it there: the flesh
// seen through the water (bent, tinted by depth, with ripple caustics), a studio's
// reflection on top, and the sun's glint.

import { BackSide, Matrix4, ShaderMaterial, Vector2, Vector3, type Camera, type Mesh } from "three";
import stage from "@/assets/hero/stage.json";
import { createSlosh } from "./slosh";

export type HeroLiquid = {
  /** Advances the water `seconds` and updates its surface; true while it is still moving. */
  update: (seconds: number, camera: Camera) => boolean;
  /** The cap has cracked off: a jolt through the water. */
  crack: () => void;
};

const vertexShader = /* glsl */ `
varying vec3 vLocal;

void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
// three declares this for the vertex stage only.
uniform mat4 modelMatrix;
uniform vec3 uCamera;
uniform vec3 uCenter;
uniform vec3 uRadii;
uniform float uTop;
uniform vec2 uTilt;
uniform float uSwell;
uniform float uRipple;
uniform float uTime;
uniform vec3 uSunDirection;
uniform float uSunIntensity;
uniform vec3 uSky;
uniform vec3 uGround;
uniform float uHemisphere;

varying vec3 vLocal;

const float PI = 3.141592653589793;
// Coconut water: nearly clear, a little cloudy and faintly straw-coloured in depth.
const vec3 absorption = vec3(1.1, 1.2, 1.6);
const vec3 cloud = vec3(0.74, 0.77, 0.72);
const float cloudiness = 0.6;
const vec3 flesh = vec3(0.955, 0.955, 0.913);
// The page behind the Hero, in linear.
const vec3 page = vec3(0.89, 0.87, 0.82);

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// Smooth value noise in 3D: two dimensions across the surface and one in time.
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}

// Ripples, the finer ones moving faster: barely there on still water and stronger as it is disturbed.
float waves(vec2 p) {
  float h = noise(vec3(p * 4.5, uTime * 1.3)) - 0.5;
  h += 0.4 * (noise(vec3(p * 10.0 + 3.1, uTime * 2.1)) - 0.5);
  return h * (0.0001 + 0.006 * uRipple);
}

// The surface's height above the still level at a point across it.
float height(vec2 p) {
  vec2 q = p / uRadii.xz;
  float h = dot(uTilt, p) + uSwell * (1.0 - 2.0 * dot(q, q)) + waves(p);
  // Up against the rim it can rise no further.
  return min(h, uTop - 0.004);
}

vec3 surfaceNormal(vec2 p) {
  const float e = 0.004;
  float dx = height(p + vec2(e, 0.0)) - height(p - vec2(e, 0.0));
  float dz = height(p + vec2(0.0, e)) - height(p - vec2(0.0, e));
  return normalize(vec3(-dx, 2.0 * e, -dz));
}

// The far side of the hollow along a ray from inside it.
float exitDistance(vec3 origin, vec3 direction) {
  vec3 o = (origin - uCenter) / uRadii;
  vec3 d = direction / uRadii;
  float a = dot(d, d);
  float b = dot(o, d);
  float c = dot(o, o) - 1.0;
  return (-b + sqrt(max(b * b - a * c, 0.0))) / a;
}

// What the surface reflects: the cream page around the coconut, brighter overhead, and two
// broad lights behind it that the swell bends into soft streaks.
vec3 studio(vec3 r) {
  vec3 light = page * mix(0.5, 1.0, smoothstep(-0.3, 0.6, r.y));
  float behind = smoothstep(0.1, -0.4, r.z);
  float elevation = asin(clamp(r.y, -1.0, 1.0));
  light += 1.4 * behind * exp(-pow((elevation - 0.55) / 0.14, 2.0));
  light += 0.9 * behind * exp(-pow((elevation - 1.0) / 0.22, 2.0));
  return light;
}

void main() {
  // Only the hollow's walls below the water count: above it, the ray never met the water.
  if (vLocal.y > height(vLocal.xz)) discard;

  vec3 ray = normalize(vLocal - uCamera);
  vec3 hit = vLocal;
  if (ray.y < -1e-3) {
    // Where the ray meets the surface, refined as the surface's own height is found.
    float t = -uCamera.y / ray.y;
    for (int i = 0; i < 4; i++) {
      vec3 p = uCamera + ray * t;
      t = (height(p.xz) - uCamera.y) / ray.y;
    }
    hit = uCamera + ray * t;
  }
  vec3 normal = surfaceNormal(hit.xz);

  // Into the water, bent by the surface, to the flesh lining the hollow.
  vec3 bent = refract(ray, normal, 1.0 / 1.333);
  float depth = exitDistance(hit, bent);
  vec3 floorPoint = hit + bent * depth;
  vec3 floorNormal = -normalize((floorPoint - uCenter) / (uRadii * uRadii));

  vec3 worldFloorNormal = normalize(mat3(modelMatrix) * floorNormal);
  vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
  vec3 worldHit = (modelMatrix * vec4(hit, 1.0)).xyz;
  vec3 view = normalize(cameraPosition - worldHit);

  // Ripples focus sunlight into bright threads on the flesh; still water throws none.
  const float e = 0.02;
  vec2 f = floorPoint.xz;
  float curvature = (waves(f + vec2(e, 0.0)) + waves(f - vec2(e, 0.0)) + waves(f + vec2(0.0, e)) + waves(f - vec2(0.0, e)) - 4.0 * waves(f)) / (e * e);
  float caustics = clamp(1.0 - curvature * 0.35 * smoothstep(0.0, 0.15, uRipple), 0.5, 1.8);

  // The flesh, lit as the scene lights it, its sunlight filtered on the way down.
  float sunDepth = max(height(f) - floorPoint.y, 0.0);
  vec3 hemisphere = mix(uGround, uSky, 0.5 + 0.5 * worldFloorNormal.y) * uHemisphere;
  vec3 sun = vec3(max(dot(worldFloorNormal, uSunDirection), 0.0) * uSunIntensity * caustics) * exp(-absorption * sunDepth);
  vec3 seen = flesh / PI * (hemisphere + sun);

  // On the way back up: absorbed, and clouded by what is suspended in it.
  vec3 through = exp(-absorption * depth);
  float clouded = 1.0 - exp(-cloudiness * depth);
  vec3 water = seen * through + cloud * uHemisphere / PI * 0.35 * clouded;

  float facing = max(dot(worldNormal, view), 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);
  vec3 reflection = studio(reflect(-view, worldNormal));
  float glint = pow(max(dot(worldNormal, normalize(uSunDirection + view)), 0.0), 900.0) * uSunIntensity * 4.0;

  // A thin bright meniscus where the water climbs the flesh.
  vec3 fromCenter = (hit - uCenter) / uRadii;
  float meniscus = smoothstep(0.96, 1.0, length(fromCenter)) * 0.12;

  vec3 color = mix(water, reflection, fresnel) + glint + meniscus;
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function vector(value: unknown, name: string) {
  if (!Array.isArray(value) || value.length !== 3) throw new Error(`Hero Liquid has no ${name}`);
  return new Vector3(...(value as [number, number, number]));
}

/** Gives the exported vessel its water, and returns the slosh that moves it. */
export function createHeroLiquid(vessel: Mesh): HeroLiquid {
  const { center, radii, top } = vessel.userData as { center?: unknown; radii?: unknown; top?: unknown };
  if (typeof top !== "number") throw new Error("Hero Liquid has no top");
  const hemisphere = stage.hemisphere;
  const uniforms = {
    uCamera: { value: new Vector3() },
    uCenter: { value: vector(center, "center") },
    uRadii: { value: vector(radii, "radii") },
    uTop: { value: top },
    uTilt: { value: new Vector2() },
    uSwell: { value: 0 },
    uRipple: { value: 0 },
    uTime: { value: 0 },
    uSunDirection: { value: new Vector3(...(stage.sun.position as [number, number, number])).normalize() },
    uSunIntensity: { value: stage.sun.intensity },
    // The light colours are sRGB in stage.json; the shader works in linear.
    uSky: { value: srgbToLinear(hemisphere.sky) },
    uGround: { value: srgbToLinear(hemisphere.ground) },
    uHemisphere: { value: hemisphere.intensity },
  };
  const previous = vessel.material;
  for (const material of [previous].flat()) material.dispose();
  vessel.material = new ShaderMaterial({ name: "Liquid", uniforms, vertexShader, fragmentShader, side: BackSide });

  const slosh = createSlosh();
  const toLocal = new Matrix4();
  const down: [number, number, number] = [0, -1, 0];
  const gravity = new Vector3();
  let last: number | null = null;

  return {
    update(seconds, camera) {
      const frame = last === null ? 0 : seconds - last;
      last = seconds;
      vessel.updateWorldMatrix(true, false);
      toLocal.copy(vessel.matrixWorld).invert();
      gravity.set(0, -1, 0).transformDirection(toLocal);
      down[0] = gravity.x;
      down[1] = gravity.y;
      down[2] = gravity.z;
      const moving = slosh.step(frame, down);
      const [tiltX, tiltZ] = slosh.tilt;
      uniforms.uTilt.value.set(tiltX, tiltZ);
      uniforms.uSwell.value = slosh.swell;
      uniforms.uRipple.value = slosh.ripple;
      uniforms.uTime.value = slosh.time;
      uniforms.uCamera.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(toLocal);
      return moving;
    },
    crack() {
      slosh.jolt(1);
    },
  };
}

function srgbToLinear(hex: string) {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return new Vector3(channel(1), channel(3), channel(5));
}
