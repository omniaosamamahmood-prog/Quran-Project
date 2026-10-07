"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  markAsMemorized,
  moveToLearning,
  removeMemorization,
} from "@/app/actions/memorization";
import { cn } from "@/lib/cn";
import type { MemorizationStatus } from "@/types/memorization";

type MemorizationItemActionsProps = {
  memorizationId: number;
  status: MemorizationStatus;
};

type ActionFailure = {
  error: string;
  code?: string;
  operation?: string;
};

export function MemorizationItemActions({
  memorizationId,
  status,
}: MemorizationItemActionsProps) {
  const t = useTranslations("Memorization");
  const locale = useLocale();
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isArabic = locale === "ar";

  function showFailure(failure: ActionFailure) {
    const raw = [
      `operation: ${failure.operation ?? "(none)"}`,
      `code: ${failure.code ?? "(none)"}`,
      `error: ${failure.error}`,
    ].join("\n");
    setDiagnostic(raw);
    console.error("[memorization action diagnostic]", failure);

    if (failure.error === "permission") {
      setError(t("errors.permission"));
    } else if (failure.error === "profile_required") {
      setError(t("errors.profileRequired"));
    } else if (failure.error === "not_found") {
      setError(t("errors.notFound"));
    } else if (failure.code) {
      setError(t("errors.actionFailedWithCode", { code: failure.code }));
    } else {
      setError(t("errors.actionFailed"));
    }
  }

  function run(
    action: () => Promise<{
      ok: boolean;
      error?: string;
      code?: string;
      operation?: string;
    }>,
  ) {
    setError("");
    setDiagnostic("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        showFailure({
          error: result.error ?? "failed",
          code: result.code,
          operation: result.operation,
        });
        return;
      }
      router.refresh();
    });
  }

  function handleMarkMemorized() {
    run(() => markAsMemorized(memorizationId));
  }

  function handleMoveToLearning() {
    run(() => moveToLearning(memorizationId));
  }

  function openRemoveDialog() {
    setError("");
    setDiagnostic("");
    setConfirmOpen(true);
  }

  function closeRemoveDialog() {
    setConfirmOpen(false);
  }

  function handleConfirmRemove() {
    if (isPending) return;
    setError("");
    setDiagnostic("");
    startTransition(async () => {
      const result = await removeMemorization(memorizationId);
      if (!result.ok) {
        showFailure({
          error: result.error ?? "failed",
          code: result.code,
          operation: result.operation,
        });
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    });
  }

  useEffect(() => {
    if (!confirmOpen) return;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setConfirmOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>("button:not([disabled])"),
      ];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [confirmOpen]);

  useEffect(() => {
    if (confirmOpen && isPending) {
      cancelRef.current?.focus();
    }
  }, [confirmOpen, isPending]);

  const buttonClass = cn(
    "inline-flex items-center justify-center rounded-xl px-3 py-1.5",
    "text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35",
    "disabled:cursor-not-allowed disabled:opacity-55",
  );

  return (
    <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === "learning" ? (
          <button
            type="button"
            onClick={handleMarkMemorized}
            disabled={isPending}
            className={cn(
              buttonClass,
              "bg-emerald text-white shadow-card hover:bg-emerald-deep",
            )}
          >
            {isPending ? t("updating") : t("markMemorized")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleMoveToLearning}
            disabled={isPending}
            className={cn(
              buttonClass,
              "border border-emerald/20 bg-surface text-emerald-deep hover:bg-sage/70",
            )}
          >
            {isPending ? t("updating") : t("moveToLearning")}
          </button>
        )}

        <button
          type="button"
          onClick={openRemoveDialog}
          disabled={isPending}
          className={cn(
            buttonClass,
            "border border-line bg-surface text-muted hover:border-red-200 hover:text-red-700",
          )}
        >
          {t("remove")}
        </button>
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35 p-4 sm:items-center"
          onClick={closeRemoveDialog}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-sm rounded-2xl border border-line bg-canvas p-5 shadow-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={titleId}
              className={cn(
                "text-base font-semibold text-emerald-deep",
                isArabic && "font-naskh text-lg leading-relaxed",
              )}
            >
              {t("removeDialog.title")}
            </h2>
            <p
              id={descriptionId}
              className={cn(
                "mt-2 text-sm leading-relaxed text-muted",
                isArabic && "font-naskh text-base leading-loose",
              )}
            >
              {t("removeDialog.description")}
            </p>

            {error || diagnostic ? (
              <div className="mt-3 space-y-1">
                {error ? (
                  <p role="alert" className="text-xs leading-relaxed text-red-700">
                    {error}
                  </p>
                ) : null}
                {diagnostic ? (
                  <pre
                    dir="ltr"
                    className="overflow-x-auto rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-start text-[0.65rem] leading-snug whitespace-pre-wrap text-red-900"
                  >
                    {diagnostic}
                  </pre>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={closeRemoveDialog}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink",
                  "transition-colors hover:bg-sage/70",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35",
                  "disabled:cursor-not-allowed disabled:opacity-55",
                )}
              >
                {t("removeDialog.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isPending}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-xl bg-red-700 px-3 text-sm font-semibold text-white",
                  "transition-colors hover:bg-red-800",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700/40",
                  "disabled:cursor-not-allowed disabled:opacity-55",
                )}
              >
                {isPending ? t("updating") : t("removeDialog.confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!confirmOpen && (error || diagnostic) ? (
        <div className="max-w-[22rem] space-y-1 text-end">
          {error ? (
            <p role="alert" className="text-xs leading-relaxed text-red-700">
              {error}
            </p>
          ) : null}
          {diagnostic ? (
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-start text-[0.65rem] leading-snug whitespace-pre-wrap text-red-900"
            >
              {diagnostic}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
