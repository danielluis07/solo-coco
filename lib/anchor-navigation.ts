// The one path for in-page links: smooth outside Static, an instant jump in
// Static, and focus always lands on the destination heading.
// Rules live in DESIGN.md § Accessibility (Reading order and navigation).

const headings = "h1, h2, h3, h4, h5, h6";

/**
 * The heading that names `target`: its labelling heading, the heading inside
 * it, or else the first heading after it (the page top leads to the h1).
 */
export function headingFor(target: HTMLElement): HTMLElement | null {
  if (target.matches(headings)) return target;
  const labelledBy = target.getAttribute("aria-labelledby");
  const label = labelledBy ? document.getElementById(labelledBy) : null;
  if (label) return label;
  const inside = target.querySelector<HTMLElement>(headings);
  if (inside) return inside;
  return (
    Array.from(document.querySelectorAll<HTMLElement>(headings)).find(
      (h) => target.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING,
    ) ?? null
  );
}

/** Scrolls to `target` with `smoothScrollTo` when given, else instantly, and focuses its heading. */
export function goToAnchor(target: HTMLElement, smoothScrollTo?: (target: HTMLElement) => void) {
  if (smoothScrollTo) smoothScrollTo(target);
  else target.scrollIntoView({ block: "start", behavior: "instant" });

  const heading = headingFor(target);
  if (!heading) return;
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
}

/** The in-page destination of a plain, unmodified primary click on a `#` link, if any. */
export function anchorTargetOf(event: MouseEvent): { hash: string; target: HTMLElement } | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
  if (!link || link.hash.length < 2) return null;
  const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
  return target ? { hash: link.hash, target } : null;
}
