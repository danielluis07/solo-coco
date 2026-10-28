import { useId } from "react";

// Stand-ins for the hand-lettered wordmark and the machete-cut symbol until the
// final artwork arrives. Both are decorative apart from the wordmark's text.

const lift = [0, -0.03, -0.05, -0.06, -0.06, -0.05, -0.03, 0];
const tilt = [-3, 1, -1, 2, -2, 1, -1, 3];

/** Display face on a lifted, uneven baseline, like a painted sign. */
export function Wordmark({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`font-display ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split("").map((ch, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              transform: `translateY(${lift[i % lift.length]}em) rotate(${tilt[i % tilt.length]}deg)`,
            }}>
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}

/** The top of a green coconut after the machete cut: a round husk with one angled notch. */
export function CocoSymbol({ className = "" }: { className?: string }) {
  const clip = useId();
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}>
          <polygon points="0,100 0,0 54,0 100,34 100,100" />
        </clipPath>
      </defs>
      <circle cx="50" cy="54" r="42" className="fill-casca" clipPath={`url(#${clip})`} />
      <path
        d="M56 13 L91 37 L88 44 L52 18 Z"
        className="fill-polpa stroke-fibra"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ellipse cx="72" cy="28" rx="7" ry="3" transform="rotate(34 72 28)" className="fill-isopor" />
    </svg>
  );
}

/** The single Letreiro brush underline, allowed under the Hero headline only. */
export function BrushUnderline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 24" className={className} aria-hidden="true" focusable="false">
      <path
        d="M4 16 C 90 6, 200 20, 396 8"
        className="stroke-letreiro"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * The dark Fibra panel's uneven, hand-cut top edge. The `clip-hand-cut` utility in
 * globals.css cuts the same line, for a panel whose grain must run up to it.
 */
export function HandCutEdge({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 24"
      preserveAspectRatio="none"
      className={`fill-fibra ${className}`}
      aria-hidden="true"
      focusable="false">
      <path d="M0 24 L0 14 L140 9 L310 16 L470 6 L640 13 L820 4 L990 12 L1200 7 L1200 24 Z" />
    </svg>
  );
}

/** Placeholder can render: a 350 ml can whose label takes the Flavour accent. */
export function CanPlaceholder({ accent, className = "" }: { accent: string; className?: string }) {
  return (
    <svg viewBox="0 0 80 140" className={className} aria-hidden="true" focusable="false">
      <rect x="10" y="6" width="60" height="128" rx="10" className="fill-isopor stroke-fibra" strokeWidth="3" />
      <rect x="10" y="30" width="60" height="80" fill={accent} className="stroke-fibra" strokeWidth="3" />
      <rect x="18" y="12" width="44" height="6" rx="3" className="fill-fibra/30" />
      <circle cx="40" cy="70" r="16" className="fill-polpa stroke-fibra" strokeWidth="2.5" />
      <path d="M44 56 L56 64 L54 67 L42 59 Z" className="fill-fibra" />
    </svg>
  );
}
