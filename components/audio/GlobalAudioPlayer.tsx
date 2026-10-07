"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { ReciterSelect } from "@/components/audio/ReciterSelect";
import { useQuranAudio } from "@/components/audio/AudioProvider";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const whole = Math.floor(seconds);
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GlobalAudioPlayer() {
  const t = useTranslations("Audio");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const {
    status,
    track,
    currentTime,
    duration,
    volume,
    errorMessage,
    hasPrevious,
    hasNext,
    isPlayerVisible,
    togglePlayPause,
    seek,
    setVolume,
    playNext,
    playPrevious,
    retry,
    dismiss,
  } = useQuranAudio();

  if (!isPlayerVisible) {
    return null;
  }

  const playing = status === "playing";
  const loading = status === "loading";
  const errored = status === "error";
  const surahName = track?.surahName ?? "…";
  const ayahNumber = track?.ayahNumber;
  const reciterName =
    track && (isArabic ? track.reciterNameAr : track.reciterNameEn);

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-50 border-t border-line bg-canvas/95 shadow-[0_-12px_40px_-28px_rgb(16_42_35_/_0.55)] backdrop-blur-md",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-0",
      )}
      role="region"
      aria-label={t("playerLabel")}
    >
      <div className="mx-auto flex w-full max-w-[75rem] flex-col gap-2 px-3 py-2.5 sm:px-6 lg:px-8 lg:py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate text-sm font-semibold text-emerald-deep",
                isArabic && "font-naskh",
              )}
            >
              {t("nowPlaying", {
                surahName,
                ayahNumber: ayahNumber ?? "—",
              })}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {loading ? t("loading") : reciterName}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-sage/70 hover:text-ink"
          >
            {t("close")}
          </button>
        </div>

        {errored ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted" role="alert">
              {errorMessage === "offline" ? t("offline") : t("error")}
            </p>
            <button
              type="button"
              onClick={() => void retry()}
              className="rounded-xl border border-emerald/20 bg-surface px-3 py-1.5 text-sm font-semibold text-emerald-deep hover:bg-sage/70"
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-end text-[0.7rem] tabular-nums text-muted">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(currentTime, duration || 0)}
                disabled={!duration || loading}
                onChange={(event) => seek(Number(event.target.value))}
                aria-label={t("seek")}
                className="h-1.5 w-full cursor-pointer accent-emerald"
              />
              <span className="w-10 shrink-0 text-[0.7rem] tabular-nums text-muted">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void playPrevious()}
                  disabled={!hasPrevious || loading}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold text-emerald-deep disabled:opacity-40"
                  aria-label={t("previous")}
                >
                  {isArabic ? "›" : "‹"}
                </button>
                <button
                  type="button"
                  onClick={togglePlayPause}
                  disabled={loading || !track}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald text-sm font-semibold text-white disabled:opacity-50"
                  aria-label={playing ? t("pause") : t("play")}
                >
                  {loading ? "…" : playing ? "❚❚" : "▶"}
                </button>
                <button
                  type="button"
                  onClick={() => void playNext()}
                  disabled={!hasNext || loading}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold text-emerald-deep disabled:opacity-40"
                  aria-label={t("next")}
                >
                  {isArabic ? "‹" : "›"}
                </button>
              </div>

              <div className="min-w-0 flex-1 sm:max-w-[16rem]">
                <ReciterSelect compact />
              </div>

              <label className="ms-auto hidden items-center gap-2 md:flex">
                <span className="sr-only">{t("volume")}</span>
                <span aria-hidden className="text-xs text-muted">
                  ♪
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="w-24 accent-emerald"
                />
              </label>
            </div>
          </>
        )}

        {/* silence unused errorMessage in UI — mapped to t("error") for safety */}
        {errorMessage ? null : null}
      </div>
    </div>
  );
}
