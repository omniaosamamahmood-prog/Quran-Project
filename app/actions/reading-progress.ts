"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getAyah, getPageForAyah } from "@/lib/quran";

export type SaveReadingProgressResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "auth_required"
        | "invalid"
        | "failed"
        | "permission"
        | "profile_required";
      code?: string;
      operation?: string;
    };

function parsePosition(
  surahNumber: number,
  ayahNumber: number,
  pageNumber: number,
): {
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
} | null {
  const surah = Number(surahNumber);
  const ayah = Number(ayahNumber);
  const page = Number(pageNumber);

  if (
    !Number.isInteger(surah) ||
    !Number.isInteger(ayah) ||
    !Number.isInteger(page)
  ) {
    return null;
  }
  if (surah < 1 || ayah < 1 || page < 1) {
    return null;
  }
  if (!getAyah(surah, ayah)) {
    return null;
  }

  const expectedPage = getPageForAyah(surah, ayah);
  if (expectedPage === undefined || expectedPage !== page) {
    return null;
  }

  return { surahNumber: surah, ayahNumber: ayah, pageNumber: page };
}

async function revalidateReadingProgress() {
  const locale = await getLocale();
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/quran`, "layout");
}

function mapWriteError(
  code: string | undefined,
  operation: string,
): SaveReadingProgressResult & { ok: false } {
  if (code === "42501" || code === "PGRST301") {
    return { ok: false, error: "permission", code, operation };
  }
  if (code === "23503") {
    return { ok: false, error: "profile_required", code, operation };
  }
  return { ok: false, error: "failed", code, operation };
}

/**
 * Explicit save of the user's single reading position.
 * Never touches public.profiles — profiles come from the signup trigger.
 *
 * First save → INSERT; later saves → UPDATE the same user_id row.
 */
export async function saveReadingProgress(
  surahNumber: number,
  ayahNumber: number,
  pageNumber: number,
): Promise<SaveReadingProgressResult> {
  const position = parsePosition(surahNumber, ayahNumber, pageNumber);
  if (!position) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "auth_required", operation: "auth.getUser" };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("reading_progress")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError && lookupError.code !== "PGRST116") {
    return mapWriteError(lookupError.code, "SELECT");
  }

  if (existing) {
    const { error } = await supabase
      .from("reading_progress")
      .update({
        surah_number: position.surahNumber,
        ayah_number: position.ayahNumber,
        page_number: position.pageNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      return mapWriteError(error.code, "UPDATE");
    }

    await revalidateReadingProgress();
    return { ok: true };
  }

  const { error: insertError } = await supabase.from("reading_progress").insert({
    user_id: user.id,
    surah_number: position.surahNumber,
    ayah_number: position.ayahNumber,
    page_number: position.pageNumber,
    updated_at: new Date().toISOString(),
  });

  if (!insertError) {
    await revalidateReadingProgress();
    return { ok: true };
  }

  // Concurrent first save (PK user_id) — fall through to UPDATE.
  if (insertError.code === "23505") {
    const { error: updateError } = await supabase
      .from("reading_progress")
      .update({
        surah_number: position.surahNumber,
        ayah_number: position.ayahNumber,
        page_number: position.pageNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      return mapWriteError(updateError.code, "UPDATE");
    }

    await revalidateReadingProgress();
    return { ok: true };
  }

  return mapWriteError(insertError.code, "INSERT");
}
