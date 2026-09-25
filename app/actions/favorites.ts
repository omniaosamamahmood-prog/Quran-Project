"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getAyah } from "@/lib/quran";

export type FavoriteActionResult =
  | { ok: true; favorited: boolean }
  | {
      ok: false;
      error:
        | "auth_required"
        | "invalid"
        | "not_found"
        | "failed"
        | "permission"
        | "profile_required";
      code?: string;
    };

function parseRef(
  surahNumber: number,
  ayahNumber: number,
): { surahNumber: number; ayahNumber: number } | null {
  const surah = Number(surahNumber);
  const ayah = Number(ayahNumber);

  if (!Number.isInteger(surah) || !Number.isInteger(ayah)) {
    return null;
  }
  if (surah < 1 || ayah < 1) {
    return null;
  }
  if (!getAyah(surah, ayah)) {
    return null;
  }

  return { surahNumber: surah, ayahNumber: ayah };
}

async function revalidateFavorites() {
  const locale = await getLocale();
  revalidatePath(`/${locale}/favorites`);
  revalidatePath(`/${locale}/quran`, "layout");
}

function mapWriteError(
  code: string | undefined,
): FavoriteActionResult & { ok: false } {
  if (code === "42501" || code === "PGRST301") {
    return { ok: false, error: "permission", code };
  }
  if (code === "23503") {
    return { ok: false, error: "profile_required", code };
  }
  return { ok: false, error: "failed", code };
}

/**
 * Server-side toggle for Favorites page remove and any server callers.
 * Never touches public.profiles — profiles come from the signup trigger.
 */
export async function toggleFavorite(
  surahNumber: number,
  ayahNumber: number,
): Promise<FavoriteActionResult> {
  const ref = parseRef(surahNumber, ayahNumber);
  if (!ref) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "auth_required" };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("surah_number", ref.surahNumber)
    .eq("ayah_number", ref.ayahNumber)
    .maybeSingle();

  if (lookupError && lookupError.code !== "PGRST116") {
    return mapWriteError(lookupError.code);
  }

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("surah_number", ref.surahNumber)
      .eq("ayah_number", ref.ayahNumber);

    if (error) {
      return mapWriteError(error.code);
    }

    await revalidateFavorites();
    return { ok: true, favorited: false };
  }

  const { error: insertError } = await supabase.from("favorites").insert({
    user_id: user.id,
    surah_number: ref.surahNumber,
    ayah_number: ref.ayahNumber,
  });

  if (!insertError || insertError.code === "23505") {
    await revalidateFavorites();
    return { ok: true, favorited: true };
  }

  return mapWriteError(insertError.code);
}

export async function removeFavorite(
  surahNumber: number,
  ayahNumber: number,
): Promise<FavoriteActionResult> {
  const ref = parseRef(surahNumber, ayahNumber);
  if (!ref) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "auth_required" };
  }

  const { error, count } = await supabase
    .from("favorites")
    .delete({ count: "exact" })
    .eq("user_id", user.id)
    .eq("surah_number", ref.surahNumber)
    .eq("ayah_number", ref.ayahNumber);

  if (error) {
    return mapWriteError(error.code);
  }

  if (count === 0) {
    return { ok: false, error: "not_found" };
  }

  await revalidateFavorites();
  return { ok: true, favorited: false };
}
