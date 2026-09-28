"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

type AdhkarCounterProps = {
  target: number;
  label?: string;
};

/**
 * Local UI-only counter for V1. Does not persist to Supabase.
 * Never exceeds the source-supplied target.
 */
export function AdhkarCounter({ target, label }: AdhkarCounterProps) {
  const t = useTranslations("Adhkar");
  const [count, setCount] = useState(0);

  if (!Number.isInteger(target) || target < 1) {
    return null;
  }

  const complete = count >= target;

  function increment() {
    setCount((current) => Math.min(current + 1, target));
  }

  function reset() {
    setCount(0);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={increment}
        disabled={complete}
        aria-label={label ?? t("counter.increment")}
        className={cn(
          "inline-flex min-h-10 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-xl px-3 py-2",
          "text-sm font-semibold tabular-nums transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35 focus-visible:ring-offset-2",
          complete
            ? "border border-emerald/30 bg-sage text-emerald-deep"
            : "border border-emerald/20 bg-surface text-emerald-deep shadow-card hover:bg-sage/70",
          "disabled:cursor-default",
        )}
      >
        <span>
          {count} / {target}
        </span>
        {complete ? (
          <span aria-hidden className="text-emerald">
            ✓
          </span>
        ) : null}
      </button>

      {count > 0 ? (
        <button
          type="button"
          onClick={reset}
          className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-sage/60 hover:text-ink"
        >
          {t("counter.reset")}
        </button>
      ) : null}

      {complete ? (
        <span className="text-xs font-medium text-emerald-deep">
          {t("counter.complete")}
        </span>
      ) : null}
    </div>
  );
}
