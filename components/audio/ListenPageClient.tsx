"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ReciterSelect } from "@/components/audio/ReciterSelect";
import { useQuranAudio } from "@/components/audio/AudioProvider";
import { cn } from "@/lib/cn";

type SurahOption = {
  number: number;
  name: string;
  ayahCount: number;
};

type ListenPageClientProps = {
  surahs: SurahOption[];
};

export function ListenPageClient({ surahs }: ListenPageClientProps) {
  const t = useTranslations("Audio");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { playAyah, status, track } = useQuranAudio();
  const [surahNumber, setSurahNumber] = useState(1);
  const [ayahNumber, setAyahNumber] = useState(1);

  const selectedSurah = useMemo(
    () => surahs.find((surah) => surah.number === surahNumber) ?? surahs[0],
    [surahNumber, surahs],
  );

  const ayahCount = selectedSurah?.ayahCount ?? 1;

  function handleSurahChange(value: number) {
    setSurahNumber(value);
    setAyahNumber(1);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">{t("surahLabel")}</span>
            <select
              value={surahNumber}
              onChange={(event) => handleSurahChange(Number(event.target.value))}
              className={cn(
                "rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/30",
                isArabic && "font-naskh",
              )}
            >
              {surahs.map((surah) => (
                <option key={surah.number} value={surah.number}>
                  {surah.number}. {surah.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">{t("ayahLabel")}</span>
            <select
              value={Math.min(ayahNumber, ayahCount)}
              onChange={(event) => setAyahNumber(Number(event.target.value))}
              className="rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/30"
            >
              {Array.from({ length: ayahCount }, (_, index) => index + 1).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <ReciterSelect />
        </div>

        <button
          type="button"
          onClick={() => {
            void playAyah({
              surahNumber,
              ayahNumber: Math.min(ayahNumber, ayahCount),
              autoplay: true,
            });
          }}
          disabled={status === "loading"}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-deep disabled:opacity-60 sm:w-auto"
        >
          {status === "loading" ? t("loading") : t("startListening")}
        </button>
      </div>

      {track ? (
        <div className="rounded-2xl border border-line bg-sage/40 px-4 py-4 sm:px-5">
          <p className="text-xs font-medium text-emerald-muted">{t("current")}</p>
          <p
            className={cn(
              "mt-1 text-base font-semibold text-emerald-deep",
              isArabic && "font-naskh",
            )}
          >
            {t("nowPlaying", {
              surahName: track.surahName,
              ayahNumber: track.ayahNumber,
            })}
          </p>
          <p
            lang="ar"
            dir="rtl"
            className="mt-3 font-quran text-[1.25rem] leading-[2.1] text-ink"
          >
            {track.ayahText}
          </p>
        </div>
      ) : null}
    </div>
  );
}
