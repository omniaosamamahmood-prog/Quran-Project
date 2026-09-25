"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { submitReviewRating } from "@/app/actions/review";
import { cn } from "@/lib/cn";
import type { MemorizationUnitType } from "@/types/memorization";
import type { ReviewRating } from "@/types/review";

export type ReviewSessionCard = {
  reviewId: number;
  unitType: MemorizationUnitType;
  title: string;
  promptKey: "promptAyah" | "promptRange" | "promptPage";
  ayahs: {
    surahNumber: number;
    ayahNumber: number;
    text: string;
    bismillah?: string;
  }[];
  mushafHref: string;
};

type ReviewSessionProps = {
  items: ReviewSessionCard[];
};

export function ReviewSession({ items }: ReviewSessionProps) {
  const t = useTranslations("Review");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(items.length === 0);
  const [error, setError] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [isPending, startTransition] = useTransition();

  const total = items.length;
  const current = !completed && index < total ? items[index] : null;
  const progressLabel =
    current != null
      ? t("session.progress", { current: index + 1, total })
      : null;

  function resetReveal() {
    setRevealed(false);
    setError("");
    setDiagnostic("");
  }

  function handleReveal() {
    setRevealed(true);
    setError("");
    setDiagnostic("");
  }

  function handleRate(rating: ReviewRating) {
    if (!current || !revealed) {
      return;
    }

    setError("");
    setDiagnostic("");

    startTransition(async () => {
      const result = await submitReviewRating(current.reviewId, rating);

      if (!result.ok) {
        const raw = [
          `operation: ${result.operation ?? "(none)"}`,
          `code: ${result.code ?? "(none)"}`,
          `error: ${result.error}`,
        ].join("\n");
        setDiagnostic(raw);
        console.error("[review rating diagnostic]", result);

        if (result.error === "permission") {
          setError(t("errors.permission"));
        } else if (result.error === "profile_required") {
          setError(t("errors.profileRequired"));
        } else if (result.error === "not_due") {
          setError(t("errors.notDue"));
        } else if (result.error === "not_found") {
          setError(t("errors.notFound"));
        } else if (result.code) {
          setError(t("errors.rateFailedWithCode", { code: result.code }));
        } else {
          setError(t("errors.rateFailed"));
        }
        return;
      }

      const nextIndex = index + 1;
      if (nextIndex >= total) {
        setCompleted(true);
        setRevealed(false);
        return;
      }

      setIndex(nextIndex);
      resetReveal();
    });
  }

  if (completed) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-5 py-10 text-center sm:px-8">
        <p className="text-lg font-semibold text-ink">{t("session.completeTitle")}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t("session.completeDescription")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/review"
            className="inline-flex rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-deep"
          >
            {t("session.backToDashboard")}
          </Link>
          <Link
            href="/quran"
            className="inline-flex rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-emerald-deep transition-colors hover:bg-sage/70"
          >
            {t("session.openQuran")}
          </Link>
        </div>
      </div>
    );
  }

  if (!current) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <p>{progressLabel}</p>
        <Link
          href="/review"
          className="font-medium text-emerald transition-colors hover:text-emerald-deep"
        >
          {t("session.exit")}
        </Link>
      </div>

      <article className="rounded-2xl border border-line bg-surface px-5 py-6 sm:px-7 sm:py-8">
        <header className="text-center">
          <p className="text-sm font-medium text-emerald-deep">{current.title}</p>
        </header>

        {!revealed ? (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="max-w-sm text-center text-sm leading-relaxed text-muted">
              {t(`session.${current.promptKey}`)}
            </p>
            <button
              type="button"
              onClick={handleReveal}
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald px-6 text-sm font-semibold text-white shadow-card transition-colors hover:bg-emerald-deep disabled:opacity-60"
            >
              {t("session.reveal")}
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div
              lang="ar"
              dir="rtl"
              className="space-y-4 font-quran text-[1.5rem] leading-[2.2] text-ink sm:text-[1.75rem] sm:leading-[2.3]"
            >
              {current.ayahs.map((ayah) => (
                <p key={`${ayah.surahNumber}:${ayah.ayahNumber}`}>
                  {ayah.bismillah ? (
                    <span className="mb-2 block text-center text-[1.02em]">
                      {ayah.bismillah}
                    </span>
                  ) : null}
                  {ayah.text}
                  <span className="ms-1 text-[0.65em] text-emerald-deep/80">
                    ﴿{ayah.ayahNumber}﴾
                  </span>
                </p>
              ))}
            </div>

            <div>
              <p className="mb-3 text-center text-sm text-muted">
                {t("session.ratePrompt")}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { rating: "difficult" as const },
                    { rating: "good" as const },
                    { rating: "easy" as const },
                  ] as const
                ).map(({ rating }) => (
                  <button
                    key={rating}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRate(rating)}
                    className={cn(
                      "inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35",
                      "disabled:cursor-not-allowed disabled:opacity-55",
                      rating === "difficult" &&
                        "border-line bg-surface text-ink hover:border-red-200 hover:bg-red-50 hover:text-red-800",
                      rating === "good" &&
                        "border-emerald/25 bg-sage/80 text-emerald-deep hover:bg-sage",
                      rating === "easy" &&
                        "border-emerald bg-emerald text-white hover:bg-emerald-deep",
                    )}
                  >
                    {t(`ratings.${rating}`)}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center">
              <Link
                href={current.mushafHref}
                className="text-sm font-medium text-emerald transition-colors hover:text-emerald-deep"
              >
                {t("openInQuran")}
              </Link>
            </p>
          </div>
        )}

        {error || diagnostic ? (
          <div className="mt-5 space-y-1.5 text-center">
            {error ? (
              <p role="alert" className="text-xs leading-relaxed text-red-700">
                {error}
              </p>
            ) : null}
            {diagnostic ? (
              <pre
                dir="ltr"
                className="mx-auto max-w-md overflow-x-auto rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-start text-[0.65rem] leading-snug whitespace-pre-wrap text-red-900"
              >
                {diagnostic}
              </pre>
            ) : null}
          </div>
        ) : null}
      </article>
    </div>
  );
}
