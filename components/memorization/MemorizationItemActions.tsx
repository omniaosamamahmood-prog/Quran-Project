"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
  const router = useRouter();
  const [error, setError] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [isPending, startTransition] = useTransition();

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

  function handleRemove() {
    if (!window.confirm(t("removeConfirm"))) {
      return;
    }
    run(() => removeMemorization(memorizationId));
  }

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
          onClick={handleRemove}
          disabled={isPending}
          className={cn(
            buttonClass,
            "border border-line bg-surface text-muted hover:border-red-200 hover:text-red-700",
          )}
        >
          {t("remove")}
        </button>
      </div>

      {error || diagnostic ? (
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
