"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { BookmarkIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase/client";

type SaveReadingPositionProps = {
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
  isAuthenticated: boolean;
  /** App path (no locale) to return to after login; may include hash. */
  returnPath: string;
  className?: string;
  onSaved?: () => void;
};

type SaveFailure = {
  ok: false;
  error: "auth_required" | "permission" | "profile_required" | "failed";
  operation: string;
  query: string;
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

/**
 * Explicit reading-position save — auth user only, then SELECT + INSERT/UPDATE.
 * Never reads or writes public.profiles (created by DB trigger on signup).
 * Does not auto-save on navigation; the user must click.
 */
async function saveReadingPositionClient(
  surahNumber: number,
  ayahNumber: number,
  pageNumber: number,
): Promise<{ ok: true } | SaveFailure> {
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

  const selectQuery =
    "from('reading_progress').select('user_id').eq('user_id', <user.id>).maybeSingle()";
  const { data: existing, error: lookupError } = await supabase
    .from("reading_progress")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

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
    const updateQuery =
      "from('reading_progress').update({ surah_number, ayah_number, page_number, updated_at }).eq('user_id', <user.id>)";
    const { error } = await supabase
      .from("reading_progress")
      .update({
        surah_number: surahNumber,
        ayah_number: ayahNumber,
        page_number: pageNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      return {
        ok: false,
        error:
          error.code === "42501" || error.code === "PGRST301"
            ? "permission"
            : error.code === "23503"
              ? "profile_required"
              : "failed",
        operation: "UPDATE",
        query: updateQuery,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      };
    }

    return { ok: true };
  }

  const insertQuery = `from('reading_progress').insert({ user_id: <user.id>, surah_number: ${surahNumber}, ayah_number: ${ayahNumber}, page_number: ${pageNumber} })`;
  const { error: insertError } = await supabase.from("reading_progress").insert({
    user_id: user.id,
    surah_number: surahNumber,
    ayah_number: ayahNumber,
    page_number: pageNumber,
    updated_at: new Date().toISOString(),
  });

  if (!insertError) {
    return { ok: true };
  }

  // Concurrent first save (PK user_id) — fall through to UPDATE.
  if (insertError.code === "23505") {
    const updateQuery =
      "from('reading_progress').update({ surah_number, ayah_number, page_number, updated_at }).eq('user_id', <user.id>)";
    const { error: updateError } = await supabase
      .from("reading_progress")
      .update({
        surah_number: surahNumber,
        ayah_number: ayahNumber,
        page_number: pageNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (!updateError) {
      return { ok: true };
    }

    return {
      ok: false,
      error:
        updateError.code === "42501" || updateError.code === "PGRST301"
          ? "permission"
          : updateError.code === "23503"
            ? "profile_required"
            : "failed",
      operation: "UPDATE",
      query: updateQuery,
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    };
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

function formatDiagnostic(failure: SaveFailure): string {
  return [
    `operation: ${failure.operation}`,
    `code: ${failure.code ?? "(none)"}`,
    `message: ${failure.message ?? "(none)"}`,
    `details: ${failure.details ?? "(none)"}`,
    `hint: ${failure.hint ?? "(none)"}`,
    `query: ${failure.query}`,
  ].join("\n");
}

export function SaveReadingPosition({
  surahNumber,
  ayahNumber,
  pageNumber,
  isAuthenticated,
  returnPath,
  className,
  onSaved,
}: SaveReadingPositionProps) {
  const t = useTranslations("ReadingProgress");
  const locale = useLocale();
  const router = useRouter();
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [isPending, startTransition] = useTransition();

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
    setSavedFlash(false);

    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    startTransition(async () => {
      const result = await saveReadingPositionClient(
        surahNumber,
        ayahNumber,
        pageNumber,
      );

      if (!result.ok) {
        if (result.error === "auth_required") {
          redirectToLogin();
          return;
        }

        const raw = formatDiagnostic(result);
        setDiagnostic(raw);
        console.error("[reading progress save diagnostic]", result);

        if (result.error === "permission") {
          setError(t("errors.permission"));
        } else if (result.error === "profile_required") {
          setError(t("errors.profileRequired"));
        } else if (result.code) {
          setError(t("errors.saveFailedWithCode", { code: result.code }));
        } else {
          setError(t("errors.saveFailed"));
        }
        return;
      }

      setSavedFlash(true);
      onSaved?.();
      router.refresh();
    });
  }

  const errorBlock =
    error || diagnostic ? (
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
    ) : null;

  return (
    <span className={cn("inline-flex flex-col items-stretch", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-3 py-2",
          "border border-emerald/20 bg-surface text-sm font-semibold text-emerald-deep",
          "shadow-card transition-colors hover:bg-sage/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          savedFlash && "border-emerald/35 bg-sage text-emerald-deep",
        )}
      >
        <BookmarkIcon className="h-4 w-4 shrink-0" />
        <span>{isPending ? t("saving") : t("save")}</span>
      </button>
      {savedFlash && !error ? (
        <p
          role="status"
          className="mt-1.5 text-center text-xs font-medium text-emerald"
        >
          {t("saved")}
        </p>
      ) : null}
      {errorBlock}
    </span>
  );
}
