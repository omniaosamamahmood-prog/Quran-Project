"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { V1_RECITERS } from "@/types/quran-audio";
import { useQuranAudio } from "@/components/audio/AudioProvider";

type ReciterSelectProps = {
  className?: string;
  compact?: boolean;
};

export function ReciterSelect({ className, compact }: ReciterSelectProps) {
  const t = useTranslations("Audio");
  const locale = useLocale();
  const { reciterId, setReciterId, status } = useQuranAudio();
  const disabled = status === "loading";

  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      {!compact ? (
        <span className="text-xs font-medium text-muted">{t("reciterLabel")}</span>
      ) : (
        <span className="sr-only">{t("reciterLabel")}</span>
      )}
      <select
        value={reciterId}
        disabled={disabled}
        onChange={(event) => setReciterId(event.target.value)}
        className={cn(
          "max-w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/30",
          "disabled:cursor-wait disabled:opacity-70",
          locale === "ar" && "font-naskh",
        )}
      >
        {V1_RECITERS.map((reciter) => (
          <option key={reciter.id} value={reciter.id}>
            {locale === "ar" ? reciter.nameAr : reciter.nameEn}
          </option>
        ))}
      </select>
    </label>
  );
}
