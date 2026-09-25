"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getAyah, getAyahRange, getQuranPage } from "@/lib/quran";
import {
  deleteReviewScheduleForMemorization,
  ensureReviewScheduleForMemorization,
} from "@/lib/review";
import { buildPageUnitInput } from "@/lib/memorization";
import type { MemorizationUnitType } from "@/types/memorization";

export type MemorizationActionResult =
  | { ok: true; status?: "learning" | "memorized"; alreadyExists?: boolean }
  | {
      ok: false;
      error:
        | "auth_required"
        | "invalid"
        | "not_found"
        | "failed"
        | "permission"
        | "profile_required"
        | "duplicate"
        | "cross_surah";
      code?: string;
      operation?: string;
    };

async function revalidateMemorization() {
  const locale = await getLocale();
  revalidatePath(`/${locale}/memorization`);
  revalidatePath(`/${locale}/review`);
  revalidatePath(`/${locale}/review`, "layout");
  revalidatePath(`/${locale}/quran`, "layout");
}

function mapWriteError(
  code: string | undefined,
  operation: string,
): MemorizationActionResult & { ok: false } {
  if (code === "42501" || code === "PGRST301") {
    return { ok: false, error: "permission", code, operation };
  }
  if (code === "23503") {
    return { ok: false, error: "profile_required", code, operation };
  }
  if (code === "23505") {
    return { ok: false, error: "duplicate", code, operation };
  }
  return { ok: false, error: "failed", code, operation };
}

type NormalizedUnit = {
  unit_type: MemorizationUnitType;
  surah_number: number;
  start_ayah_number: number;
  end_ayah_number: number;
  page_number: number | null;
};

function normalizeAyahUnit(
  surahNumber: number,
  ayahNumber: number,
): NormalizedUnit | null {
  const surah = Number(surahNumber);
  const ayah = Number(ayahNumber);
  if (!Number.isInteger(surah) || !Number.isInteger(ayah)) {
    return null;
  }
  if (!getAyah(surah, ayah)) {
    return null;
  }
  return {
    unit_type: "ayah",
    surah_number: surah,
    start_ayah_number: ayah,
    end_ayah_number: ayah,
    page_number: null,
  };
}

function normalizeRangeUnit(
  surahNumber: number,
  startAyah: number,
  endAyah: number,
): NormalizedUnit | { error: "cross_surah" | "invalid" } {
  const surah = Number(surahNumber);
  const a = Number(startAyah);
  const b = Number(endAyah);
  if (!Number.isInteger(surah) || !Number.isInteger(a) || !Number.isInteger(b)) {
    return { error: "invalid" };
  }

  const start = Math.min(a, b);
  const end = Math.max(a, b);

  if (!getAyah(surah, start) || !getAyah(surah, end)) {
    return { error: "invalid" };
  }

  const range = getAyahRange(surah, start, end);
  if (!range) {
    return { error: "invalid" };
  }

  // Same Surah already enforced by getAyahRange; start===end → treat as ayah.
  if (start === end) {
    return {
      unit_type: "ayah",
      surah_number: surah,
      start_ayah_number: start,
      end_ayah_number: start,
      page_number: null,
    };
  }

  return {
    unit_type: "range",
    surah_number: surah,
    start_ayah_number: start,
    end_ayah_number: end,
    page_number: null,
  };
}

function normalizePageUnit(pageNumber: number): NormalizedUnit | null {
  const page = Number(pageNumber);
  if (!Number.isInteger(page) || !getQuranPage(page)) {
    return null;
  }
  const built = buildPageUnitInput(page);
  if (!built) {
    return null;
  }
  return {
    unit_type: "page",
    surah_number: built.surahNumber,
    start_ayah_number: built.startAyahNumber,
    end_ayah_number: built.endAyahNumber,
    page_number: built.pageNumber,
  };
}

async function findExactUnit(
  userId: string,
  unit: NormalizedUnit,
): Promise<{ id: number; status: string } | null | { error: string }> {
  const supabase = await createClient();
  let query = supabase
    .from("memorization")
    .select("id, status")
    .eq("user_id", userId)
    .eq("unit_type", unit.unit_type);

  if (unit.unit_type === "page") {
    query = query.eq("page_number", unit.page_number!);
  } else {
    query = query
      .eq("surah_number", unit.surah_number)
      .eq("start_ayah_number", unit.start_ayah_number)
      .eq("end_ayah_number", unit.end_ayah_number)
      .is("page_number", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error && error.code !== "PGRST116") {
    return { error: error.code ?? "failed" };
  }
  return data ?? null;
}

async function insertUnit(
  userId: string,
  unit: NormalizedUnit,
): Promise<MemorizationActionResult> {
  const existing = await findExactUnit(userId, unit);
  if (existing && "error" in existing) {
    return mapWriteError(existing.error, "SELECT");
  }
  if (existing) {
    await revalidateMemorization();
    return {
      ok: true,
      alreadyExists: true,
      status: existing.status === "memorized" ? "memorized" : "learning",
    };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error: insertError } = await supabase.from("memorization").insert({
    user_id: userId,
    unit_type: unit.unit_type,
    surah_number: unit.surah_number,
    start_ayah_number: unit.start_ayah_number,
    end_ayah_number: unit.end_ayah_number,
    page_number: unit.page_number,
    status: "learning",
    updated_at: now,
  });

  if (!insertError) {
    await revalidateMemorization();
    return { ok: true, status: "learning" };
  }

  if (insertError.code === "23505") {
    await revalidateMemorization();
    return { ok: true, alreadyExists: true, status: "learning" };
  }

  return mapWriteError(insertError.code, "INSERT");
}

/** Add a single-ayah unit as `learning`. */
export async function addAyahToMemorization(
  surahNumber: number,
  ayahNumber: number,
): Promise<MemorizationActionResult> {
  const unit = normalizeAyahUnit(surahNumber, ayahNumber);
  if (!unit) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "auth_required", operation: "auth.getUser" };
  }

  return insertUnit(user.id, unit);
}

/** Add a same-Surah range as ONE unit. */
export async function addRangeToMemorization(
  surahNumber: number,
  startAyahNumber: number,
  endAyahNumber: number,
): Promise<MemorizationActionResult> {
  const normalized = normalizeRangeUnit(
    surahNumber,
    startAyahNumber,
    endAyahNumber,
  );
  if ("error" in normalized) {
    return { ok: false, error: normalized.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "auth_required", operation: "auth.getUser" };
  }

  return insertUnit(user.id, normalized);
}

/** Add a full Mushaf page as ONE unit. */
export async function addPageToMemorization(
  pageNumber: number,
): Promise<MemorizationActionResult> {
  const unit = normalizePageUnit(pageNumber);
  if (!unit) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "auth_required", operation: "auth.getUser" };
  }

  return insertUnit(user.id, unit);
}

/** @deprecated Prefer addAyahToMemorization — kept for compatibility. */
export async function addToMemorization(
  surahNumber: number,
  ayahNumber: number,
): Promise<MemorizationActionResult> {
  return addAyahToMemorization(surahNumber, ayahNumber);
}

/** learning → memorized by unit id; ensures one review schedule. */
export async function markAsMemorized(
  memorizationId: number,
): Promise<MemorizationActionResult> {
  const id = Number(memorizationId);
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "auth_required", operation: "auth.getUser" };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("memorization")
    .update({
      status: "memorized",
      memorized_at: now,
      updated_at: now,
    })
    .eq("user_id", user.id)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return mapWriteError(error.code, "UPDATE");
  }

  if (!data) {
    return { ok: false, error: "not_found", operation: "UPDATE" };
  }

  const schedule = await ensureReviewScheduleForMemorization(user.id, data.id);
  if (!schedule.ok) {
    console.error("[markAsMemorized review schedule]", schedule);
  }

  await revalidateMemorization();
  return { ok: true, status: "memorized" };
}

/** memorized → learning by unit id; deletes review schedule. */
export async function moveToLearning(
  memorizationId: number,
): Promise<MemorizationActionResult> {
  const id = Number(memorizationId);
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "auth_required", operation: "auth.getUser" };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("memorization")
    .update({
      status: "learning",
      memorized_at: null,
      updated_at: now,
    })
    .eq("user_id", user.id)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return mapWriteError(error.code, "UPDATE");
  }

  if (!data) {
    return { ok: false, error: "not_found", operation: "UPDATE" };
  }

  const removed = await deleteReviewScheduleForMemorization(user.id, data.id);
  if (!removed.ok) {
    console.error("[moveToLearning review schedule]", removed);
  }

  await revalidateMemorization();
  return { ok: true, status: "learning" };
}

/** DELETE the memorization unit — cascade removes its review. */
export async function removeMemorization(
  memorizationId: number,
): Promise<MemorizationActionResult> {
  const id = Number(memorizationId);
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "auth_required", operation: "auth.getUser" };
  }

  const { error, count } = await supabase
    .from("memorization")
    .delete({ count: "exact" })
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) {
    return mapWriteError(error.code, "DELETE");
  }

  if (count === 0) {
    return { ok: false, error: "not_found", operation: "DELETE" };
  }

  await revalidateMemorization();
  return { ok: true };
}
