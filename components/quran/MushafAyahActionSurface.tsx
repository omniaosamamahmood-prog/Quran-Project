"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import { useQuranAudio } from "@/components/audio/AudioProvider";
import { cn } from "@/lib/cn";

const WIDE_QUERY = "(min-width: 1024px)";

/**
 * The mobile nav is 3.75rem plus safe-area padding. A small gap above
 * that nav, and a further gap when the audio player is open, keeps the
 * sheet visible without covering either one.
 */
const SHEET_BOTTOM = "calc(4.85rem + env(safe-area-inset-bottom, 0px))";
const SHEET_BOTTOM_WITH_PLAYER =
  "calc(10.1rem + env(safe-area-inset-bottom, 0px))";

type AnchorOffset = {
  x: number;
  y: number;
};

type MushafAyahActionSurfaceProps = {
  open: boolean;
  anchor: HTMLElement | null;
  /** Click position inside the anchor box, so the panel follows the tapped words. */
  anchorOffset: AnchorOffset | null;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

type PanelPosition = {
  top: number;
  left: number;
};

function subscribeWide(onChange: () => void) {
  const media = window.matchMedia(WIDE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getWideSnapshot() {
  return window.matchMedia(WIDE_QUERY).matches;
}

function getWideServerSnapshot() {
  return false;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function anchorBox(element: HTMLElement, offset: AnchorOffset | null): DOMRect {
  const rect = element.getBoundingClientRect();
  if (!offset) {
    return rect;
  }
  return new DOMRect(rect.left + offset.x, rect.top + offset.y, 1, 1);
}

function placeNearAnchor(anchorRect: DOMRect, panel: HTMLElement): PanelPosition {
  const margin = 12;
  const gap = 8;
  const width = panel.offsetWidth;
  const height = panel.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = anchorRect.left + anchorRect.width / 2 - width / 2;
  left = Math.min(
    Math.max(left, margin),
    Math.max(margin, viewportWidth - width - margin),
  );

  const spaceBelow = viewportHeight - anchorRect.bottom - gap - margin;
  const spaceAbove = anchorRect.top - gap - margin;
  let top =
    spaceBelow >= height || spaceBelow >= spaceAbove
      ? anchorRect.bottom + gap
      : anchorRect.top - gap - height;

  top = Math.min(
    Math.max(top, margin),
    Math.max(margin, viewportHeight - height - margin),
  );

  return { top, left };
}

export function MushafAyahActionSurface({
  open,
  anchor,
  anchorOffset,
  title,
  closeLabel,
  onClose,
  children,
}: MushafAyahActionSurfaceProps) {
  const locale = useLocale();
  const { isPlayerVisible } = useQuranAudio();
  const wide = useSyncExternalStore(
    subscribeWide,
    getWideSnapshot,
    getWideServerSnapshot,
  );
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [position, setPosition] = useState<PanelPosition | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    if (!open || !wide) {
      return;
    }

    function update() {
      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      const next =
        anchor && anchor.isConnected
          ? placeNearAnchor(anchorBox(anchor, anchorOffset), panel)
          : {
              top: Math.max(12, window.innerHeight - panel.offsetHeight - 12),
              left: Math.max(12, (window.innerWidth - panel.offsetWidth) / 2),
            };

      setPosition((current) =>
        current && current.top === next.top && current.left === next.left
          ? current
          : next,
      );
    }

    update();
    const panel = panelRef.current;
    const observer = panel ? new ResizeObserver(update) : null;
    if (panel) {
      observer?.observe(panel);
    }
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, wide, anchor, anchorOffset, title]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.activeElement;
    closeRef.current?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (wide || event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const items = getFocusable(panelRef.current);
      if (items.length === 0) {
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = panelRef.current.contains(active);

      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element) || !panelRef.current) {
        return;
      }

      if (panelRef.current.contains(target)) {
        return;
      }

      if (target.closest(".mushaf-ayah-hit")) {
        return;
      }

      if (target.closest("[role='dialog']")) {
        return;
      }

      onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      if (previous instanceof HTMLElement) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [open, wide]);

  if (!open) {
    return null;
  }

  const sheetBottom = isPlayerVisible ? SHEET_BOTTOM_WITH_PLAYER : SHEET_BOTTOM;
  const titleClass = cn(
    "min-w-0 text-sm font-medium leading-6 text-ink",
    locale === "ar" && "font-naskh",
  );

  const header = (
    <div className="mb-3 flex items-start justify-between gap-3">
      <p id={titleId} className={titleClass} aria-live="polite">
        {title}
      </p>
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted transition-colors hover:bg-sage/60 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald"
      >
        {closeLabel}
      </button>
    </div>
  );

  if (!wide) {
    return (
      <>
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[45] bg-ink/25"
          style={{ bottom: sheetBottom }}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          id="mushaf-ayah-actions"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-ayah-actions="sheet"
          className="mushaf-ayah-sheet fixed inset-x-0 z-[46] max-h-[min(46dvh,22rem)] overflow-y-auto rounded-t-2xl border border-line border-t-2 border-t-gold bg-canvas px-4 pt-3 pb-3 shadow-[0_-16px_40px_-28px_rgb(16_42_35_/_0.55)]"
          style={{ bottom: sheetBottom }}
        >
          {header}
          {children}
        </div>
        <style href="mushaf-ayah-sheet" precedence="mushaf-ayah-sheet">{`
          .mushaf-ayah-sheet {
            animation: mushaf-ayah-sheet-in 180ms ease-out;
          }
          @keyframes mushaf-ayah-sheet-in {
            from { transform: translateY(0.75rem); }
            to { transform: translateY(0); }
          }
        `}</style>
      </>
    );
  }

  return (
    <div
      ref={panelRef}
      id="mushaf-ayah-actions"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-ayah-actions="popover"
      className="fixed z-[46] max-h-[min(24rem,calc(100dvh-1.5rem))] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-line border-t-2 border-t-gold bg-canvas p-3 shadow-panel"
      style={{
        top: position ? `${position.top}px` : "12px",
        left: position ? `${position.left}px` : "12px",
        visibility: position ? "visible" : "hidden",
      }}
    >
      {header}
      {children}
    </div>
  );
}
