// PROTOTYPE: SVG pieces every label variant draws with, in strip coordinates (2048 x 1024).
import type { ReactNode } from "react";
import { palette, type FruitKey } from "./tokens";

export const display = "var(--font-bowlby-one)";
export const body = "var(--font-figtree)";

/** Font size that fits `text` in `width` at Bowlby One's wide set (~0.72 em a glyph). */
export function fit(text: string, width: number, max: number) {
  return Math.min(max, width / (text.length * 0.72));
}

/** Stand-in for the hand-lettered wordmark: Bowlby One on a lifted, uneven baseline. */
export function Wordmark({ x, y, size, fill }: { x: number; y: number; size: number; fill: string }) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={size}
      textAnchor="middle"
      letterSpacing={size * -0.02}
      style={{ fontFamily: display }}
      // Per-glyph lift and tilt, like a painted sign; dy deltas trace a gentle arch.
      dy="0 -0.03em -0.02em -0.01em 0 0.01em 0.02em 0.03em"
      rotate="-3 1 -1 2 -2 1 -1 3">
      SoloCoco
    </text>
  );
}

/** The machete-cut coconut top: round husk, one angled notch showing the flesh. */
export function CocoSymbol({ id, x, y, size, husk = palette.casca }: { id: string; x: number; y: number; size: number; husk?: string }) {
  const s = size / 100;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}>
      <clipPath id={`cut-${id}`}>
        <polygon points="0,100 0,0 54,0 100,34 100,100" />
      </clipPath>
      <circle cx="50" cy="54" r="42" fill={husk} clipPath={`url(#cut-${id})`} />
      <path d="M56 13 L91 37 L88 44 L52 18 Z" fill={palette.polpa} stroke={palette.fibra} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="72" cy="28" rx="7" ry="3" transform="rotate(34 72 28)" fill={palette.isopor} />
    </g>
  );
}

/** A board with uneven corner radii, as if cut by hand: [tl, tr, br, bl]. */
export function boardPath(x: number, y: number, w: number, h: number, [tl, tr, br, bl]: number[]) {
  return `M${x + tl},${y} H${x + w - tr} Q${x + w},${y} ${x + w},${y + tr} V${y + h - br} Q${x + w},${y + h} ${x + w - br},${y + h} H${x + bl} Q${x},${y + h} ${x},${y + h - bl} V${y + tl} Q${x},${y} ${x + tl},${y} Z`;
}

/** A painted board with the hard, offset Fibra drop shadow (no blur). */
export function Board({
  x,
  y,
  w,
  h,
  fill,
  tilt = 0,
  radii = [36, 20, 32, 16],
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  tilt?: number;
  radii?: number[];
  children?: ReactNode;
}) {
  const d = boardPath(x, y, w, h, radii);
  return (
    <g transform={`rotate(${tilt} ${x + w / 2} ${y + h / 2})`}>
      <path d={d} fill={palette.fibra} transform="translate(12 16)" />
      <path d={d} fill={fill} />
      {children}
    </g>
  );
}

/** Lines of body text, centred on x. */
export function Lines({ x, y, size, fill, lines, weight = 500 }: { x: number; y: number; size: number; fill: string; lines: string[]; weight?: number }) {
  return (
    <text x={x} y={y} fill={fill} fontSize={size} fontWeight={weight} textAnchor="middle" style={{ fontFamily: body }}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : size * 1.3}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

const ink = palette.fibra;
const stroke = { stroke: ink, strokeWidth: 6, strokeLinejoin: "round" as const };

/**
 * Stand-ins for the painted fruit, drawn in a 200 x 200 box: flat fills, a thick Fibra
 * outline and one highlight stroke, like the fruit on a juice-stand menu board.
 * The real art would come from a paid-tier AI image, repainted to this style (ADR 0002).
 */
const fruitArt: Record<FruitKey, ReactNode> = {
  coco: (
    <>
      <ellipse cx="100" cy="108" rx="90" ry="78" fill="#6E8F35" {...stroke} />
      <ellipse cx="100" cy="104" rx="68" ry="56" fill={palette.polpa} {...stroke} strokeWidth={4} />
      <ellipse cx="100" cy="102" rx="44" ry="34" fill={palette.isopor} />
      <path d="M64 86 Q78 70 102 68" stroke={palette.polpa} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.9" />
    </>
  ),
  maracuja: (
    <>
      <circle cx="100" cy="100" r="90" fill="#D9931A" {...stroke} />
      <circle cx="100" cy="100" r="70" fill="#F8D54E" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r = i % 2 ? 46 : 26;
        return <ellipse key={i} cx={100 + Math.cos(a) * r} cy={100 + Math.sin(a) * r} rx="6" ry="9" transform={`rotate(${(a * 180) / Math.PI} ${100 + Math.cos(a) * r} ${100 + Math.sin(a) * r})`} fill={ink} />;
      })}
      <circle cx="100" cy="100" r="7" fill={ink} />
    </>
  ),
  caju: (
    <>
      <path d="M58 88 C34 104 44 182 100 190 C156 182 166 104 142 88 C124 76 76 76 58 88 Z" fill="#E8662A" {...stroke} />
      <path d="M70 70 C58 44 82 14 106 22 C126 28 122 50 108 56 C98 60 98 72 96 80 C86 84 76 80 70 70 Z" fill="#A9A27A" {...stroke} />
      <path d="M74 112 Q76 146 96 166" stroke={palette.polpa} strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.85" />
    </>
  ),
  acai: (
    <>
      <path d="M100 18 L100 60 M100 40 L64 66 M100 44 L138 64" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      {[
        [100, 70], [70, 86], [130, 84], [52, 116], [86, 110], [118, 110], [150, 116],
        [68, 144], [102, 140], [136, 144], [86, 172], [118, 172],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="20" fill="#2E1238" stroke={ink} strokeWidth="4" />
          <circle cx={cx - 6} cy={cy - 7} r="4.5" fill={palette.polpa} opacity="0.75" />
        </g>
      ))}
    </>
  ),
  limao: (
    <>
      <circle cx="100" cy="100" r="90" fill="#5E8F2A" {...stroke} />
      <circle cx="100" cy="100" r="76" fill="#EEF2C8" />
      <circle cx="100" cy="100" r="68" fill="#C9DD6E" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return <line key={i} x1="100" y1="100" x2={100 + Math.cos(a) * 68} y2={100 + Math.sin(a) * 68} stroke="#EEF2C8" strokeWidth="6" />;
      })}
      <circle cx="100" cy="100" r="9" fill="#EEF2C8" />
    </>
  ),
  goiaba: (
    <>
      <circle cx="100" cy="100" r="90" fill="#B9C44C" {...stroke} />
      <circle cx="100" cy="100" r="76" fill="#F7B9C3" />
      <circle cx="100" cy="100" r="46" fill="#E0697F" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = i % 2 ? 30 : 18;
        return <circle key={i} cx={100 + Math.cos(a) * r} cy={100 + Math.sin(a) * r} r="5" fill="#F8E9CC" />;
      })}
    </>
  ),
};

export function Fruit({ kind, x, y, size }: { kind: FruitKey; x: number; y: number; size: number }) {
  const s = size / 200;
  return <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}>{fruitArt[kind]}</g>;
}
