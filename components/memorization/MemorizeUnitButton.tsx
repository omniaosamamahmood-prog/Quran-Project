"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MemorizeIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase/client";
import type { MemorizationUnitType } from "@/types/memorization";

type UnitPayload =
  | {
      unitType: "ayah";
      surahNumber: number;
      startAyahNumber: number;
      endAyahNumber: number;
      pageNumber?: null;
    }
  | {
      unitType: "range";
      surahNumber: number;
      startAyahNumber: number;
      endAyahNumber: number;
      pageNumber?: null;
    }
  | {
      unitType: "page";
      pageNumber: number;
      surahNumber: number;
      startAyahNumber: number;
      endAyahNumber: number;
    };

type AddFailure = {
  ok: false;
  error: "auth_required" | "permission" | "profile_required" | "failed";
  operation: string;
  query: string;
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

async function addMemorizationUnitClient(
  payload: UnitPayload,
): Promise<{ ok: true; alreadyExists: boolean } | AddFailure> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      ok: false,
      error: "auth_required",
      operation: "auth.getSession",
      query: "supabase.auth.getSession()",
    };
  }

  const user = session.user;
  let lookup = supabase
    .from("memorization")
    .select("id")
    .eq("user_id", user.id)
    .eq("unit_type", payload.unitType);

  if (payload.unitType === "page") {
    lookup = lookup.eq("page_number", payload.pageNumber);
  } else {
    lookup = lookup
      .eq("surah_number", payload.surahNumber)
      .eq("start_ayah_number", payload.startAyahNumber)
      .eq("end_ayah_number", payload.endAyahNumber)
      .is("page_number", null);
  }

  const selectQuery = `from('memorization').select('id').eq('unit_type', '${payload.unitType}')…`;
  const { data: existing, error: lookupError } = await lookup.maybeSingle();

  if (lookupError && lookupError.code !== "PGRST116") {
    return {
      ok: false,
      error:
        lookupError.code === "42501" || lookupError.code === "PGRST301"
          ? "permission"
          : "failed",
      operation: "SELECT",
      query: selectQuery,
      code: lookupError.code,
      message: lookupError.message,
      details: lookupError.details,
      hint: lookupError.hint,
    };
  }

  if (existing) {
    return { ok: true, alreadyExists: true };
  }

  const row = {
    user_id: user.id,
    unit_type: payload.unitType,
    surah_number: payload.surahNumber,
    start_ayah_number: payload.startAyahNumber,
    end_ayah_number: payload.endAyahNumber,
    page_number: payload.unitType === "page" ? payload.pageNumber : null,
    status: "learning" as const,
    updated_at: new Date().toISOString(),
  };

  const insertQuery = `from('memorization').insert({ unit_type: '${payload.unitType}', … })`;
  const { error: insertError } = await supabase.from("memorization").insert(row);

  if (!insertError) {
    return { ok: true, alreadyExists: false };
  }

  if (insertError.code === "23505") {
    return { ok: true, alreadyExists: true };
  }

  return {
    ok: false,
    error:
      insertError.code === "23503"
        ? "profile_required"
        : insertError.code === "42501" || insertError.code === "PGRST301"
          ? "permission"
          : "failed",
    operation: "INSERT",
    query: insertQuery,
    code: insertError.code,
    message: insertError.message,
    details: insertError.details,
    hint: insertError.hint,
  };
}

function formatDiagnostic(failure: AddFailure): string {
  return [
    `operation: ${failure.operation}`,
    `code: ${failure.code ?? "(none)"}`,
    `message: ${failure.message ?? "(none)"}`,
    `details: ${failure.details ?? "(none)"}`,
    `hint: ${failure.hint ?? "(none)"}`,
    `query: ${failure.query}`,
  ].join("\n");
}

type MemorizeUnitButtonProps = {
  label: string;
  pendingLabel: string;
  payload: UnitPayload;
  alreadyAdded: boolean;
  isAuthenticated: boolean;
  returnPath: string;
  className?: string;
  onAdded?: () => void;
};

export function MemorizeUnitButton({
  label,
  pendingLabel,
  payload,
  alreadyAdded,
  isAuthenticated,
  returnPath,
  className,
  onAdded,
}: MemorizeUnitButtonProps) {
  const t = useTranslations("Memorization");
  const locale = useLocale();
  const router = useRouter();
  const [added, setAdded] = useState(alreadyAdded);
  const [synced, setSynced] = useState(alreadyAdded);
  const [error, setError] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [isPending, startTransition] = useTransition();

  if (alreadyAdded !== synced) {
    setSynced(alreadyAdded);
    setAdded(alreadyAdded);
  }

  function redirectToLogin() {
    const path = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
    const next = `/${locale}${path}`;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setError("");
    setDiagnostic("");

    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    if (added) {
      return;
    }

    startTransition(async () => {
      const result = await addMemorizationUnitClient(payload);

      if (!result.ok) {
        if (result.error === "auth_required") {
          redirectToLogin();
          return;
        }

        const raw = formatDiagnostic(result);
        setDiagnostic(raw);
        console.error("[memorization add diagnostic]", result);

        if (result.error === "permission") {
          setError(t("errors.permission"));
        } else if (result.error === "profile_required") {
          setError(t("errors.profileRequired"));
        } else if (result.code) {
          setError(t("errors.addFailedWithCode", { code: result.code }));
        } else {
          setError(t("errors.addFailed"));
        }
        return;
      }

      setAdded(true);
      onAdded?.();
      router.refresh();
    });
  }

  return (
    <span className={cn("inline-flex flex-col items-stretch", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || added}
        aria-pressed={added}
        className={cn(
          "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-3 py-2",
          "text-sm font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed",
          added
            ? "border border-emerald/25 bg-sage/80 text-emerald-deep opacity-90"
            : "border border-emerald/20 bg-surface text-emerald-deep shadow-card hover:bg-sage/70 disabled:opacity-60",
        )}
      >
        <MemorizeIcon className="h-4 w-4 shrink-0" />
        <span>{isPending ? pendingLabel : added ? t("alreadyAdded") : label}</span>
      </button>
      {error || diagnostic ? (
        <div className="mt-1.5 max-w-[22rem] space-y-1.5 text-center">
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
    </span>
  );
}

export type { UnitPayload, MemorizationUnitType };
