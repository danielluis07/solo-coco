// Keeps the visible content and the focused element in place across a layout
// change, such as releasing ScrollTrigger pins when the page enters Static.

export type ViewportSnapshot = {
  /** An element in view, and its offset from the viewport top. */
  anchor: Element | null;
  top: number;
  focused: Element | null;
};

export function captureViewport(): ViewportSnapshot {
  const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 4);
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
