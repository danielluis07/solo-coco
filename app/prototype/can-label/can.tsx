// PROTOTYPE: a cheap CSS-3D can that wraps a label strip, plus the flat strip with UV guides.
// Each face is an <svg> showing one slice of the strip via <use>, so page fonts still apply.
import { strip } from "./tokens";

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.23 0 0 0 0 0.16 0 0 0 0 0.11 0 0 0 0.09 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// Lit from the upper left; the camera never moves, so the shading stays put while the label turns.
const shading =
  "linear-gradient(90deg, rgba(58,42,29,0.55) 0%, rgba(58,42,29,0.12) 14%, rgba(255,255,255,0.28) 27%, rgba(255,255,255,0) 40%, rgba(58,42,29,0) 62%, rgba(58,42,29,0.25) 84%, rgba(58,42,29,0.6) 100%)";
const metal = "linear-gradient(90deg, #6f7478 0%, #c9ced1 22%, #f2f4f5 32%, #b7bdc1 55%, #8b9196 80%, #5d6266 100%)";

/** `angle` 0 shows the front panel (u = 0.25); 180 shows the back. */
export function Can({ stripId, width, angle, faces = 40 }: { stripId: string; width: number; angle: number; faces?: number }) {
  const r = width / 2;
  const round = Math.PI * width;
  const labelH = (round * strip.h) / strip.w;
  const fw = round / faces;
  const sliceW = strip.w / faces;
  const rim = width * 0.07;
  return (
    <div style={{ width }} className="relative select-none">
      <div style={{ height: rim, background: metal }} className="mx-[3%] rounded-t-[40%_100%]" />
      <div style={{ height: rim * 0.45, background: metal }} className="opacity-80" />
      <div style={{ height: labelH, perspective: width * 8 }} className="relative overflow-visible">
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transform: `rotateY(${-angle}deg)` }}>
          {Array.from({ length: faces }, (_, i) => {
            const u = (((0.25 + i / faces) % 1) + 1) % 1;
            return (
              <svg
                key={i}
                viewBox={`${u * strip.w} 0 ${sliceW} ${strip.h}`}
                preserveAspectRatio="none"
                className="absolute top-0"
                style={{
                  left: (width - fw) / 2,
                  width: fw + 0.8,
                  height: labelH,
                  transform: `rotateY(${(i * 360) / faces}deg) translateZ(${r * Math.cos(Math.PI / faces)}px)`,
                  backfaceVisibility: "hidden",
                }}>
                <use href={`#${stripId}`} width={strip.w} height={strip.h} />
              </svg>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: `${shading}, ${grain}` }} />
      </div>
      <div style={{ height: rim * 0.45, background: metal }} className="opacity-80" />
      <div style={{ height: rim * 0.8, background: metal }} className="mx-[5%] rounded-b-[30%_100%]" />
    </div>
  );
}

/** The label as flat art for the UV strip, with the front/back panels and the seam marked. */
export function FlatStrip({ stripId, guides }: { stripId: string; guides: boolean }) {
  const { w, h, front, back, side, panel } = strip;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full">
      <use href={`#${stripId}`} width={w} height={h} />
      {guides && (
        <g fontFamily="var(--font-figtree)" fontSize="30" fontWeight="700">
          {[front, back].map((x) => (
            <rect key={x} x={x - panel} y={8} width={panel * 2} height={h - 16} fill="none" stroke="#d946ef" strokeWidth="4" strokeDasharray="18 12" />
          ))}
          {[
            { x: 3, label: "seam (u 0)", anchor: "start" as const },
            { x: front, label: "front (u 0.25)", anchor: "middle" as const },
            { x: side, label: "side (u 0.5)", anchor: "middle" as const },
            { x: back, label: "back (u 0.75)", anchor: "middle" as const },
            { x: w - 3, label: "seam (u 1)", anchor: "end" as const },
          ].map((g) => (
            <g key={g.label}>
              <line x1={g.x} x2={g.x} y1={0} y2={h} stroke="#d946ef" strokeWidth="4" />
              <text x={g.x + (g.anchor === "start" ? 10 : g.anchor === "end" ? -10 : 0)} y={h - 22} textAnchor={g.anchor} fill="#d946ef" stroke="#fff" strokeWidth="8" paintOrder="stroke">
                {g.label}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
