"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { TafsirApiError, TafsirPayload } from "@/types/tafsir";

type TafsirPanelProps = {
  open: boolean;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  /** Local Uthmani text from quran.json — never API Quran text. */
  ayahText: string;
  onClose: () => void;
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: TafsirPayload }
  | { status: "error"; retryable: boolean };

async function fetchTafsir(
  surahNumber: number,
  ayahNumber: number,
): Promise<{ ok: true; data: TafsirPayload } | { ok: false; retryable: boolean }> {
  try {
    const response = await fetch(
      `/api/tafsir?surah=${surahNumber}&ayah=${ayahNumber}`,
      { method: "GET", headers: { Accept: "application/json" } },
    );

    if (!response.ok) {
      let retryable = response.status >= 500 || response.status === 429;
      try {
        const body = (await response.json()) as TafsirApiError;
        if (
          body.error === "invalid_input" ||
          body.error === "ayah_not_found" ||
          body.error === "unavailable" ||
          body.error === "config" ||
          body.error === "auth"
        ) {
          retryable = body.error === "auth" || body.error === "config";
        }
      } catch {
        // ignore parse failures — keep status-based retryable
      }
      return { ok: false, retryable };
    }

    const data = (await response.json()) as TafsirPayload;
    if (!data.tafsir || !data.sourceName) {
      return { ok: false, retryable: true };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, retryable: true };
  }
}

export function TafsirPanel({
  open,
  surahNumber,
  ayahNumber,
  surahName,
  ayahText,
  onClose,
}: TafsirPanelProps) {
  const t = useTranslations("Tafsir");
  const locale = useLocale();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [requestKey, setRequestKey] = useState(0);
  const targetKey = open
    ? `${surahNumber}:${ayahNumber}:${requestKey}`
    : null;
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({ status: "idle" });

  if (targetKey !== activeKey) {
    setActiveKey(targetKey);
    setState(targetKey ? { status: "loading" } : { status: "idle" });
  }

  useEffect(() => {
    if (!targetKey) {
      return;
    }

    let cancelled = false;

    void fetchTafsir(surahNumber, ayahNumber).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setState({ status: "ready", data: result.data });
      } else {
        setState({ status: "error", retryable: result.retryable });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [targetKey, surahNumber, ayahNumber]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const isArabicUi = locale === "ar";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:justify-end sm:p-4">
      <button
        type="button"
        aria-label={t("close")}
        className="absolute inset-0 bg-emerald-ink/35 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-[1] flex w-full max-h-[88dvh] flex-col overflow-hidden",
          "rounded-t-2xl border border-line bg-canvas shadow-panel",
          "sm:max-h-[min(92dvh,44rem)] sm:max-w-md sm:rounded-2xl",
          "animate-[tafsir-rise_220ms_ease-out]",
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className={cn(
                "text-base font-semibold text-emerald-deep sm:text-lg",
                isArabicUi && "leading-relaxed",
              )}
            >
              {t("title")}
            </h2>
            <p
              className={cn(
                "mt-0.5 text-sm text-muted",
                isArabicUi && "leading-relaxed",
              )}
            >
              {t("subtitle", {
                surahName,
                ayahNumber,
              })}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-xl px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-sage/70 hover:text-ink"
          >
            {t("close")}
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <div className="rounded-xl border border-line-soft bg-surface/80 px-3.5 py-3.5">
            <p
              lang="ar"
              dir="rtl"
              className="font-quran text-[1.35rem] leading-[2.2] text-ink"
            >
              {ayahText}
            </p>
          </div>

          <div>
            <h3
              className={cn(
                "mb-2 text-sm font-semibold tracking-wide text-emerald",
                isArabicUi && "leading-relaxed",
              )}
            >
              {t("sectionLabel")}
            </h3>

            {state.status === "loading" || state.status === "idle" ? (
              <p
                className={cn(
                  "text-sm text-muted",
                  isArabicUi && "leading-relaxed",
                )}
                aria-live="polite"
              >
                {t("loading")}
              </p>
            ) : null}

            {state.status === "error" ? (
              <div className="space-y-3" role="alert">
                <p
                  className={cn(
                    "text-sm text-muted",
                    isArabicUi && "leading-relaxed",
                  )}
                >
                  {t("error")}
                </p>
                {state.retryable ? (
                  <button
                    type="button"
                    onClick={() => setRequestKey((value) => value + 1)}
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-emerald/20 bg-surface px-3 py-2 text-sm font-semibold text-emerald-deep transition-colors hover:bg-sage/70"
                  >
                    {t("retry")}
                  </button>
                ) : null}
              </div>
            ) : null}

            {state.status === "ready" ? (
              <div className="space-y-4">
                <div
                  lang="ar"
                  dir="rtl"
                  className="rounded-xl border border-emerald/12 bg-sage/40 px-3.5 py-3.5 font-naskh text-[1.05rem] leading-[1.95] text-ink"
                >
                  {state.data.tafsir}
                </div>
                <p
                  className={cn(
                    "text-xs text-muted",
                    isArabicUi && "leading-relaxed",
                  )}
                >
                  {t("source", { name: state.data.sourceName })}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <style href="tafsir-panel" precedence="tafsir-panel">{`
        @keyframes tafsir-rise {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (min-width: 640px) {
          @keyframes tafsir-rise {
            from {
              opacity: 0;
              transform: translateX(0.75rem);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        }
      `}</style>
    </div>
  );
}
