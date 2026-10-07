"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ListenAyahButton } from "@/components/audio/ListenAyahButton";
import { useActiveQuranAyah } from "@/components/audio/AudioProvider";
import { cn } from "@/lib/cn";
import {
  MEMORIZATION_REPEAT_COUNTS,
  type MemorizationRepeatCount,
} from "@/lib/audio-repeat";

type PracticeAyah = {
  surahNumber: number;
  ayahNumber: number;
  text: string;
  bismillah?: string;
};

export function MemorizationPracticeAudio({ ayahs }: { ayahs: PracticeAyah[] }) {
  const t = useTranslations("Memorization");
  const activeAyah = useActiveQuranAyah();
  const [repeatCount, setRepeatCount] = useState<MemorizationRepeatCount>(1);

  return (
    <div className="mt-3 space-y-3">
      <div
        role="group"
        aria-label={t("repeat.label")}
        className="flex flex-wrap items-center gap-1.5"
      >
        <span className="text-xs font-medium text-muted">{t("repeat.label")}</span>
        {MEMORIZATION_REPEAT_COUNTS.map((count) => {
          const selected = repeatCount === count;
          return (
            <button
              key={count}
              type="button"
              aria-pressed={selected}
              onClick={() => setRepeatCount(count)}
              className={cn(
                "inline-flex h-8 min-w-10 items-center justify-center rounded-full border px-2.5 text-xs font-semibold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35 focus-visible:ring-offset-2",
                selected
                  ? "border-emerald bg-emerald text-white"
                  : "border-line bg-surface text-emerald-deep hover:bg-sage/70",
              )}
            >
              {t("repeat.option", { count })}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {ayahs.map((ayah) => {
          const isActive =
            activeAyah?.surahNumber === ayah.surahNumber &&
            activeAyah.ayahNumber === ayah.ayahNumber;

          return (
            <div key={`${ayah.surahNumber}:${ayah.ayahNumber}`}>
              <div
                lang="ar"
                dir="rtl"
                className="font-quran text-[1.35rem] leading-[2.1] text-ink sm:text-[1.5rem] sm:leading-[2.2]"
              >
                <p className={isActive ? "mushaf-ayah-active" : undefined}>
                  {ayah.bismillah ? (
                    <span className="mb-2 block text-center text-[1.02em]">
                      {ayah.bismillah}
                    </span>
                  ) : null}
                  {ayah.text}
                  <span className="ms-1 text-[0.7em] text-emerald-deep/80">
                    ﴿{ayah.ayahNumber}﴾
                  </span>
                </p>
              </div>
              <ListenAyahButton
                surahNumber={ayah.surahNumber}
                ayahNumber={ayah.ayahNumber}
                repeatCount={repeatCount}
                compact
                className="mt-1.5"
              />
            </div>
          );
        })}
      </div>

      <style href="memorization-ayah-active" precedence="memorization-ayah-active">{`
        .mushaf-ayah-active {
          background-color: rgba(184, 148, 74, 0.2);
          border-radius: 0.12em;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
          transition: background-color 220ms ease;
        }
      `}</style>
    </div>
  );
}
