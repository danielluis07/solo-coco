import { wordmarkPath, symbolPath } from "@/lib/brand-art";
import { handCutPath } from "@/lib/hand-cut";

/** Original drawn artwork; generated path data keeps the SVG sources canonical. */
export function Wordmark({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`inline-block ${className}`}>
      <span className="sr-only">{text}</span>
      <svg viewBox="0 0 430 100" className="h-[1em] w-[4.3em]" aria-hidden="true" focusable="false">
        <path d={wordmarkPath} fill="currentColor" fillRule="evenodd" />
      </svg>
    </span>
  );
}

export function CocoSymbol({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path d={symbolPath} className="fill-casca" />
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

/** The dark Fibra statement's uneven, hand-cut top edge (lib/hand-cut.ts). */
export function HandCutEdge({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 24"
      preserveAspectRatio="none"
      className={`fill-fibra ${className}`}
      aria-hidden="true"
      focusable="false">
      <path d={handCutPath} />
    </svg>
  );
}
