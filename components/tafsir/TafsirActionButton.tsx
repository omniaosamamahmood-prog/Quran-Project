"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TafsirPanel } from "@/components/tafsir/TafsirPanel";
import { BookIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type TafsirActionButtonProps = {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  ayahText: string;
  className?: string;
};

/**
 * Mushaf ayah-actions entry for Tafsir.
 * Opens the shared panel; no auth required (public religious content).
 */
export function TafsirActionButton({
  surahNumber,
  ayahNumber,
  surahName,
  ayahText,
  className,
}: TafsirActionButtonProps) {
  const t = useTranslations("Tafsir");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-3 py-2",
          "border border-emerald/20 bg-surface text-sm font-semibold text-emerald-deep shadow-card",
          "transition-colors hover:bg-sage/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35 focus-visible:ring-offset-2",
          className,
        )}
      >
        <BookIcon className="h-4 w-4 shrink-0" />
        <span>{t("action")}</span>
      </button>

      <TafsirPanel
        open={open}
        surahNumber={surahNumber}
        ayahNumber={ayahNumber}
        surahName={surahName}
        ayahText={ayahText}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
