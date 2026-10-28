// Keeps the visible content and the focused element in place across a layout
// change, such as releasing ScrollTrigger pins when the page enters Static.

export type ViewportSnapshot = {
  /** An element in view, and its offset from the viewport top. */
  anchor: Element | null;
  top: number;
  focused: Element | null;
};

export function captureViewport(): ViewportSnapshot {
  // At the page top, the top is what stays.
  if (scrollY === 0) return { anchor: null, top: 0, focused: document.activeElement };
  let hit = document.elementFromPoint(innerWidth / 2, innerHeight / 4);
  // A pin's spacer goes away with the pin; the pinned element stays.
  if (hit?.classList.contains("pin-spacer")) hit = hit.firstElementChild;
  // A pinned frame that is laid out anew on release (the Hero's Vitrine) names what to
  // keep in place instead: whatever the visitor saw there is rearranged around it.
  const kept = hit?.closest(".pin-spacer > *")?.querySelector("[data-viewport-anchor]");
  if (kept) hit = kept;
  const anchor = hit && hit !== document.body && hit !== document.documentElement ? hit : null;
  return {
    anchor,
    top: anchor?.getBoundingClientRect().top ?? 0,
    focused: document.activeElement,
  };
}

export function restoreViewport({ anchor, top, focused }: ViewportSnapshot) {
  if (anchor?.isConnected) {
    const drift = anchor.getBoundingClientRect().top - top;
    if (drift !== 0) window.scrollBy({ top: drift, behavior: "instant" });
  }
  if (focused instanceof HTMLElement && focused.isConnected && document.activeElement !== focused) {
    focused.focus({ preventScroll: true });
  }
}
