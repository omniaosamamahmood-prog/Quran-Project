"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useFavoriteKeys } from "@/components/favorites/FavoriteKeysProvider";
import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase/client";
import { isDeviceOffline } from "@/lib/pwa/offline";
import { favoriteKey } from "@/types/favorites";

type FavoriteToggleProps = {
  surahNumber: number;
  ayahNumber: number;
  /** Used when this toggle is outside FavoriteKeysProvider. */
  initialFavorited?: boolean;
  /** App path (no locale) to return to after login; may include hash. */
  returnPath: string;
  className?: string;
  /** Icon-only (Surah flow) or labeled button (Mushaf action bar). */
  variant?: "icon" | "button";
  onFavoritedChange?: (favorited: boolean) => void;
};

type FavoriteFailure = {
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
 * Favorites toggle — auth user only, then favorites SELECT / INSERT / DELETE.
 * Never reads or writes public.profiles (created by DB trigger on signup).
 */
async function toggleFavoriteClient(
  surahNumber: number,
  ayahNumber: number,
): Promise<{ ok: true; favorited: boolean } | FavoriteFailure> {
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

  const favoritesSelectQuery = `from('favorites').select('id').eq('user_id', <user.id>).eq('surah_number', ${surahNumber}).eq('ayah_number', ${ayahNumber}).maybeSingle()`;
  const { data: existing, error: lookupError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("surah_number", surahNumber)
    .eq("ayah_number", ayahNumber)
    .maybeSingle();

  if (lookupError && lookupError.code !== "PGRST116") {
    return {
      ok: false,
      error:
        lookupError.code === "42501" || lookupError.code === "PGRST301"
          ? "permission"
          : "failed",
      operation: "SELECT",
      query: favoritesSelectQuery,
      code: lookupError.code,
      message: lookupError.message,
      details: lookupError.details,
      hint: lookupError.hint,
    };
  }

  if (existing) {
    const favoritesDeleteQuery =
      "from('favorites').delete().eq('user_id', <user.id>).eq('surah_number', …).eq('ayah_number', …)";
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("surah_number", surahNumber)
      .eq("ayah_number", ayahNumber);

    if (error) {
      return {
        ok: false,
        error:
          error.code === "42501" || error.code === "PGRST301"
            ? "permission"
            : "failed",
        operation: "DELETE",
        query: favoritesDeleteQuery,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      };
    }

    return { ok: true, favorited: false };
  }

  const favoritesInsertQuery = `from('favorites').insert({ user_id: <user.id>, surah_number: ${surahNumber}, ayah_number: ${ayahNumber} })`;
  const { error: insertError } = await supabase.from("favorites").insert({
    user_id: user.id,
    surah_number: surahNumber,
    ayah_number: ayahNumber,
  });

  if (!insertError) {
    return { ok: true, favorited: true };
  }

  if (insertError.code === "23505") {
    return { ok: true, favorited: true };
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
    query: favoritesInsertQuery,
    code: insertError.code,
    message: insertError.message,
    details: insertError.details,
    hint: insertError.hint,
  };
}

function formatDiagnostic(failure: FavoriteFailure): string {
  return [
    `operation: ${failure.operation}`,
    `code: ${failure.code ?? "(none)"}`,
    `message: ${failure.message ?? "(none)"}`,
    `details: ${failure.details ?? "(none)"}`,
    `hint: ${failure.hint ?? "(none)"}`,
    `query: ${failure.query}`,
  ].join("\n");
}

export function FavoriteToggle({
  surahNumber,
  ayahNumber,
  initialFavorited = false,
  returnPath,
  className,
  variant = "icon",
  onFavoritedChange,
}: FavoriteToggleProps) {
  const t = useTranslations("Favorites");
  const locale = useLocale();
  const router = useRouter();
  const favoriteKeys = useFavoriteKeys();
  const key = favoriteKey(surahNumber, ayahNumber);
  const remoteFavorited = favoriteKeys
    ? favoriteKeys.keys.has(key)
    : initialFavorited;
  const [favorited, setFavorited] = useState(remoteFavorited);
  const [syncedInitial, setSyncedInitial] = useState(remoteFavorited);
  const [error, setError] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [isPending, startTransition] = useTransition();

  if (remoteFavorited !== syncedInitial) {
    setSyncedInitial(remoteFavorited);
    setFavorited(remoteFavorited);
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

    if (isDeviceOffline()) {
      setError(t("errors.offline"));
      return;
    }

    startTransition(async () => {
      const previous = favorited;
      setFavorited(!previous);

      let result: Awaited<ReturnType<typeof toggleFavoriteClient>>;
      try {
        result = await toggleFavoriteClient(surahNumber, ayahNumber);
      } catch {
        setFavorited(previous);
        setError(
          isDeviceOffline() ? t("errors.offline") : t("errors.toggleFailed"),
        );
        return;
      }

      if (!result.ok) {
        setFavorited(previous);
        if (isDeviceOffline()) {
          setError(t("errors.offline"));
          return;
        }
        if (result.error === "auth_required") {
          redirectToLogin();
          return;
        }

        const raw = formatDiagnostic(result);
        setDiagnostic(raw);
        console.error("[favorites toggle diagnostic]", result);

        if (result.error === "permission") {
          setError(t("errors.permission"));
        } else if (result.error === "profile_required") {
          setError(t("errors.profileRequired"));
        } else if (result.code) {
          setError(t("errors.toggleFailedWithCode", { code: result.code }));
        } else {
          setError(t("errors.toggleFailed"));
        }
        return;
      }

      setFavorited(result.favorited);
      favoriteKeys?.setKey(key, result.favorited);
      onFavoritedChange?.(result.favorited);
      router.refresh();
    });
  }

  const label = favorited ? t("remove") : t("add");
  const pendingLabel = favorited ? t("removing") : t("adding");

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

  if (variant === "button") {
    return (
      <span className={cn("inline-flex flex-col items-stretch", className)}>
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          aria-pressed={favorited}
          className={cn(
            "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-3 py-2",
            "text-sm font-semibold transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
            favorited
              ? "border border-emerald/25 bg-sage text-emerald-deep hover:bg-sage/80"
              : "bg-emerald text-white shadow-card hover:bg-emerald-deep",
          )}
        >
          <HeartIcon filled={favorited} className="h-4 w-4 shrink-0" />
          <span>{isPending ? pendingLabel : label}</span>
        </button>
        {errorBlock}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-col items-center", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={favorited}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          "text-muted hover:bg-sage/70 hover:text-emerald",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35",
          "disabled:cursor-not-allowed disabled:opacity-55",
          favorited && "text-emerald",
        )}
      >
        <HeartIcon filled={favorited} className="h-3.5 w-3.5" />
      </button>
      {errorBlock}
    </span>
  );
}
