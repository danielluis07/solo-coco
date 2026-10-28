"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
  type ReactNode,
} from "react";
import {
  copy,
  defaultPack,
  packLabel,
  packs,
  quickAddAnnouncement,
  type Flavour,
} from "@/content/page";

// The decorative Quick-add pack picker. Rules live in DESIGN.md § Accessibility
// (Quick-add) and § Quick-add layout and state. Nothing is ever bought.

const { quickAdd } = copy;

type QuickAddState = {
  /** Slug of the Flavour whose picker is open; at most one at a time. */
  openSlug: string | null;
  setOpenSlug: Dispatch<SetStateAction<string | null>>;
  /** Pack count chosen for a Flavour. */
  selectedCount: (slug: string) => number;
  /** Records a new selection and announces it once. */
  select: (flavour: Flavour, count: number) => void;
  /** The latest focus move came from the keyboard rather than a pointer. */
  focusMovedByKeyboard: () => boolean;
};

const QuickAddContext = createContext<QuickAddState | null>(null);

/**
 * Owns every Flavour's selection and which picker is open, in memory for this
 * page instance: they survive re-renders and tier changes, and reload resets them.
 */
export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [announcement, setAnnouncement] = useState("");

  const select = useCallback((flavour: Flavour, count: number) => {
    setSelections((prev) => ({ ...prev, [flavour.slug]: count }));
    setAnnouncement(quickAddAnnouncement(flavour, packFor(count)));
  }, []);

  // Which input moved focus last, so a blur can tell tabbing out from clicking.
  const lastInput = useRef<"keyboard" | "pointer">("keyboard");
  useEffect(() => {
    const onPointerDown = () => (lastInput.current = "pointer");
    const onKeyDown = () => (lastInput.current = "keyboard");
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  // A click outside the open Quick-add closes it without touching focus. Closing
  // on click rather than press keeps the layout still until the click has landed.
  useEffect(() => {
    if (!openSlug) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(`[data-quick-add="${openSlug}"]`)) return;
      // Another card's “Escolher” may already have taken over.
      setOpenSlug((current) => (current === openSlug ? null : current));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openSlug]);

  const value = useMemo<QuickAddState>(
    () => ({
      openSlug,
      setOpenSlug,
      selectedCount: (slug) => selections[slug] ?? defaultPack.count,
      select,
      focusMovedByKeyboard: () => lastInput.current === "keyboard",
    }),
    [openSlug, selections, select],
  );

  return (
    <QuickAddContext value={value}>
      {children}
      <p role="status" aria-live="polite" className="sr-only" data-quick-add-status>
        {announcement}
      </p>
    </QuickAddContext>
  );
}

function packFor(count: number) {
  return packs.find((p) => p.count === count) ?? defaultPack;
}

/** The selected pack, the “Escolher” button and, when open, the inline picker. */
export function QuickAdd({ flavour }: { flavour: Flavour }) {
  const state = use(QuickAddContext);
  if (!state) throw new Error("QuickAdd must sit inside QuickAddProvider");
  const { openSlug, setOpenSlug, selectedCount, select, focusMovedByKeyboard } = state;

  const pickerId = useId();
  const openerRef = useRef<HTMLButtonElement>(null);
  const isOpen = openSlug === flavour.slug;
  const selected = selectedCount(flavour.slug);

  const close = (returnFocus: boolean) => {
    setOpenSlug(null);
    if (returnFocus) openerRef.current?.focus();
  };

  const commit = (count: number) => {
    if (count !== selected) select(flavour, count);
    close(true);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      close(true);
    }
  };

  return (
    <div data-quick-add={flavour.slug} onKeyDown={onKeyDown} className="mt-auto pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-xl tabular-nums">{packLabel(packFor(selected))}</p>
        <button
          ref={openerRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls={isOpen ? pickerId : undefined}
          onClick={() => setOpenSlug(isOpen ? null : flavour.slug)}
          className="min-h-11 cursor-pointer rounded-board-alt bg-letreiro px-5 font-display text-lg text-polpa shadow-board-sm">
          {quickAdd.open}
        </button>
      </div>
      {isOpen && (
        <PackPicker
          id={pickerId}
          name={`pack-${flavour.slug}`}
          selected={selected}
          onCommit={commit}
          onClose={() => close(true)}
          onLeave={() => {
            // Pointer focus moves are left to the outside-click handler.
            if (focusMovedByKeyboard()) close(false);
          }}
        />
      )}
    </div>
  );
}

const browseKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

/**
 * Native radios: the arrow keys move through the options, then click, Enter or
 * Space picks the checked one. Escape (handled by QuickAdd) discards browsing.
 */
function PackPicker({
  id,
  name,
  selected,
  onCommit,
  onClose,
  onLeave,
}: {
  id: string;
  name: string;
  selected: number;
  onCommit: (count: number) => void;
  onClose: () => void;
  onLeave: () => void;
}) {
  const [checked, setChecked] = useState(selected);
  const selectedRef = useRef<HTMLInputElement>(null);
  // Set while an arrow key is down, so the radio click it triggers only browses.
  const browsing = useRef(false);

  useEffect(() => {
    selectedRef.current?.focus();
  }, []);

  const onRadioKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (browseKeys.has(event.key)) {
      browsing.current = true;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onCommit(Number(event.currentTarget.value));
    }
  };

  return (
    <div
      id={id}
      onBlur={(event) => {
        // Tabbing out closes; focus stays wherever it went.
        const next = event.relatedTarget as Node | null;
        if (next && !event.currentTarget.contains(next)) onLeave();
      }}
      className="mt-4 rounded-board bg-polpa p-4 text-fibra shadow-board-sm motion-safe:animate-fade-in">
      <fieldset>
        <legend className="font-display text-lg">
          {quickAdd.heading}
        </legend>
        <div className="mt-2 flex flex-col gap-1">
          {packs.map((pack) => (
            <label
              key={pack.count}
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-board-alt px-3 font-semibold tabular-nums has-checked:bg-isopor">
              <input
                ref={pack.count === selected ? selectedRef : undefined}
                type="radio"
                name={name}
                value={pack.count}
                checked={checked === pack.count}
                onChange={() => setChecked(pack.count)}
                onKeyDown={onRadioKeyDown}
                onKeyUp={() => (browsing.current = false)}
                onClick={() => {
                  if (browsing.current) {
                    browsing.current = false;
                    return;
                  }
                  onCommit(pack.count);
                }}
                className="size-5 shrink-0 accent-letreiro"
              />
              {packLabel(pack)}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-3 text-sm">{quickAdd.helper}</p>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 min-h-11 cursor-pointer rounded-board-alt border-2 border-fibra px-4 font-semibold">
        {quickAdd.close}
      </button>
    </div>
  );
}
