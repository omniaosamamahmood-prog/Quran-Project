"use client";

import { useTranslations } from "next-intl";
import { HeadphonesIcon } from "@/components/ui/icons";
import { useQuranAudio } from "@/components/audio/AudioProvider";
import { cn } from "@/lib/cn";

type ListenAyahButtonProps = {
  surahNumber: number;
  ayahNumber: number;
  className?: string;
  /** When set, this ayah repeats that many times and then stops. */
  repeatCount?: number;
  compact?: boolean;
};

export function ListenAyahButton({
  surahNumber,
  ayahNumber,
  className,
  repeatCount,
  compact = false,
}: ListenAyahButtonProps) {
  const t = useTranslations("Audio");
  const { playAyah, status, track } = useQuranAudio();
  const isCurrent =
    track?.surahNumber === surahNumber && track?.ayahNumber === ayahNumber;
  const loading = status === "loading" && isCurrent;
  const active =
    isCurrent && (status === "playing" || status === "paused" || status === "loading");

  return (
    <button
      type="button"
      onClick={() => {
        void playAyah({
          surahNumber,
          ayahNumber,
          autoplay: true,
          ...(repeatCount != null ? { repeatCount } : {}),
        });
      }}
      disabled={loading}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 border bg-surface font-semibold text-emerald-deep",
        "transition-colors hover:bg-sage/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35 focus-visible:ring-offset-2",
        "disabled:cursor-wait disabled:opacity-70",
        compact
          ? "min-h-10 rounded-lg px-2.5 py-1.5 text-xs"
          : "min-h-9 rounded-xl px-3 py-2 text-sm shadow-card",
        active ? "border-emerald" : "border-emerald/20",
        className,
      )}
    >
      <HeadphonesIcon className="h-4 w-4 shrink-0" />
      <span>{loading ? t("loading") : t("listen")}</span>
    </button>
  );
}
