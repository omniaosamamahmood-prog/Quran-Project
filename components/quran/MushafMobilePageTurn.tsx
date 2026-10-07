"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";

const MIN_SWIPE_PX = 64;
const LOCK_PX = 18;
const AXIS_RATIO = 1.5;
const SLOW_MOUSE_MS = 250;

type MushafMobilePageTurnProps = {
  previousHref: string | null;
  nextHref: string | null;
  children: ReactNode;
};

type Gesture = {
  pointerId: number;
  x: number;
  y: number;
  t0: number;
  pointerType: string;
  lock: "undecided" | "scroll" | "swipe";
  turned: boolean;
  selection: string;
};

/**
 * Drag turning for the Arabic Mushaf.
 * Left to right moves forward. Right to left moves backward.
 * Arabic and English share this direction because the Mushaf is RTL in both.
 */
export function MushafMobilePageTurn({
  previousHref,
  nextHref,
  children,
}: MushafMobilePageTurnProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hrefRef = useRef({ previousHref, nextHref });
  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    hrefRef.current = { previousHref, nextHref };
    routerRef.current = router;
  }, [previousHref, nextHref, router]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    let gesture: Gesture | null = null;

    function sheetIsOpen() {
      return document.querySelector("[data-ayah-actions='sheet']") != null;
    }

    function blockedTarget(target: EventTarget | null) {
      if (!(target instanceof Element)) {
        return true;
      }
      return Boolean(
        target.closest(
          "a, button, input, textarea, select, label, [role='dialog'], [data-ayah-actions]",
        ),
      );
    }

    function canTrack(event: PointerEvent) {
      if (!event.isPrimary || event.shiftKey) {
        return false;
      }
      if (event.pointerType === "mouse") {
        return event.button === 0;
      }
      return event.pointerType === "touch" || event.pointerType === "pen";
    }

    function onPointerDown(event: PointerEvent) {
      if (!canTrack(event) || sheetIsOpen() || blockedTarget(event.target)) {
        gesture = null;
        return;
      }
      const currentRoot = rootRef.current;
      if (!currentRoot?.contains(event.target as Node)) {
        return;
      }

      releasePointer();
      gesture = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        t0: performance.now(),
        pointerType: event.pointerType,
        lock: "undecided",
        turned: false,
        selection: window.getSelection()?.toString() ?? "",
      };
      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerCancel);
    }

    function releasePointer() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    }

    function onPointerCancel(event: PointerEvent) {
      if (!gesture || event.pointerId !== gesture.pointerId) {
        return;
      }
      gesture = null;
      releasePointer();
    }

    function onPointerMove(event: PointerEvent) {
      if (!gesture || event.pointerId !== gesture.pointerId || gesture.turned) {
        return;
      }
      if (sheetIsOpen()) {
        gesture.lock = "scroll";
        return;
      }

      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;

      if (gesture.lock === "undecided") {
        if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) {
          return;
        }
        const horizontal = Math.abs(dx) > Math.abs(dy) * AXIS_RATIO;
        const slowMouse =
          gesture.pointerType === "mouse" &&
          performance.now() - gesture.t0 > SLOW_MOUSE_MS;
        gesture.lock = horizontal && !slowMouse ? "swipe" : "scroll";
      }

      if (gesture.lock === "swipe") {
        event.preventDefault();
        if (gesture.pointerType === "mouse" && gesture.selection.trim().length === 0) {
          window.getSelection()?.removeAllRanges();
        }
      }
    }

    function onPointerUp(event: PointerEvent) {
      const current = gesture;
      gesture = null;
      releasePointer();
      if (!current || event.pointerId !== current.pointerId || current.turned) {
        return;
      }
      if (current.lock !== "swipe" || sheetIsOpen()) {
        return;
      }

      const dx = event.clientX - current.x;
      const dy = event.clientY - current.y;
      if (Math.abs(dx) < MIN_SWIPE_PX || Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) {
        return;
      }

      const selected = window.getSelection()?.toString() ?? "";
      const selectingText =
        current.selection.trim().length > 0 ||
        (current.pointerType !== "mouse" &&
          selected.trim().length >= 3 &&
          performance.now() - current.t0 > 280);
      if (selectingText) {
        return;
      }

      const href = dx > 0 ? hrefRef.current.nextHref : hrefRef.current.previousHref;
      if (!href) {
        return;
      }

      current.turned = true;
      window.getSelection()?.removeAllRanges();
      routerRef.current.push(href);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      releasePointer();
    };
  }, []);

  return (
    <div ref={rootRef} className="mushaf-turn-root">
      {children}
      <style href="mushaf-mobile-page-turn" precedence="mushaf-mobile-page-turn">{`
        .mushaf-turn-root {
          touch-action: pan-y;
        }
        @media (max-width: 899px) {
          .mushaf-turn-root {
            width: 100%;
            max-width: 100%;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}
