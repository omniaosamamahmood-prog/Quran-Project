import { createClient } from "@/lib/supabase/server";
import {
  isMemorizationUnitType,
  type MemorizationUnitType,
} from "@/types/memorization";
import type {
  MemorizationReviewRow,
  ReviewDashboardCounts,
  ReviewScheduleItem,
} from "@/types/review";

type MemorizationJoin = {
  id: number;
  unit_type: string;
  surah_number: number;
  start_ayah_number: number;
  end_ayah_number: number | null;
  page_number: number | null;
  status: string;
};

type ReviewWithMemorization = MemorizationReviewRow & {
  memorization: MemorizationJoin | MemorizationJoin[] | null;
};

function unwrapMemorization(
  join: MemorizationJoin | MemorizationJoin[] | null,
): MemorizationJoin | null {
  if (!join) {
    return null;
  }
  return Array.isArray(join) ? (join[0] ?? null) : join;
}

function toScheduleItem(row: ReviewWithMemorization): ReviewScheduleItem | null {
  const memo = unwrapMemorization(row.memorization);
  if (!memo || memo.status !== "memorized") {
    return null;
  }
  if (!isMemorizationUnitType(memo.unit_type)) {
    return null;
  }

  const unitType: MemorizationUnitType = memo.unit_type;

  return {
    reviewId: row.id,
    memorizationId: row.memorization_id,
    unitType,
    surahNumber: memo.surah_number,
    startAyahNumber: memo.start_ayah_number,
    endAyahNumber: memo.end_ayah_number,
    pageNumber: memo.page_number,
    lastReviewedAt: row.last_reviewed_at,
    nextReviewAt: row.next_review_at,
    reviewCount: row.review_count,
    lastRating: row.last_rating,
    intervalDays: row.interval_days,
  };
}

/** Start of the UTC calendar day for `date`. */
export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function endOfUtcDay(date: Date): Date {
  const start = startOfUtcDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Ensure every memorized ayah for the authenticated user has a review schedule.
 * Idempotent — UNIQUE(user_id, memorization_id) / 23505 is ignored.
 * Does not touch public.profiles. Respects RLS.
 */
export async function ensureReviewSchedulesForMemorized(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: memorized, error: memoError } = await supabase
    .from("memorization")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "memorized");

  if (memoError || !memorized || memorized.length === 0) {
    return;
  }

  const { data: existing, error: reviewError } = await supabase
    .from("memorization_reviews")
    .select("memorization_id")
    .eq("user_id", user.id);

  if (reviewError) {
    return;
  }

  const existingIds = new Set(
    (existing ?? []).map((row) => row.memorization_id as number),
  );
  const missing = memorized.filter((row) => !existingIds.has(row.id));

  if (missing.length === 0) {
    return;
  }

  const now = new Date().toISOString();
  const { error: insertError } = await supabase
    .from("memorization_reviews")
    .insert(
      missing.map((row) => ({
        user_id: user.id,
        memorization_id: row.id,
        last_reviewed_at: null,
        next_review_at: now,
        review_count: 0,
        last_rating: null,
        interval_days: 0,
        updated_at: now,
      })),
    );

  // Race / duplicate: ignore unique violations.
  if (insertError && insertError.code !== "23505") {
    console.error("[review schedule sync]", insertError);
  }
}

/**
 * Create one review schedule for a memorization row (learning → memorized).
 * Safe if the row already exists (23505 → ok).
 */
export async function ensureReviewScheduleForMemorization(
  userId: string,
  memorizationId: number,
): Promise<{ ok: true } | { ok: false; code?: string; message?: string }> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("memorization_reviews").insert({
    user_id: userId,
    memorization_id: memorizationId,
    last_reviewed_at: null,
    next_review_at: now,
    review_count: 0,
    last_rating: null,
    interval_days: 0,
    updated_at: now,
  });

  if (!error || error.code === "23505") {
    return { ok: true };
  }

  return { ok: false, code: error.code, message: error.message };
}

/** Remove review schedule when memorized → learning (V1). */
export async function deleteReviewScheduleForMemorization(
  userId: string,
  memorizationId: number,
): Promise<{ ok: true } | { ok: false; code?: string; message?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("memorization_reviews")
    .delete()
    .eq("user_id", userId)
    .eq("memorization_id", memorizationId);

  if (error) {
    return { ok: false, code: error.code, message: error.message };
  }

  return { ok: true };
}

async function loadReviewSchedules(options?: {
  skipEnsure?: boolean;
}): Promise<{ ok: true; items: ReviewScheduleItem[] } | { ok: false }> {
  if (!options?.skipEnsure) {
    await ensureReviewSchedulesForMemorized();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: true, items: [] };
  }

  const { data, error } = await supabase
    .from("memorization_reviews")
    .select(
      `
      id,
      user_id,
      memorization_id,
      last_reviewed_at,
      next_review_at,
      review_count,
      last_rating,
      interval_days,
      created_at,
      updated_at,
      memorization!inner (
        id,
        unit_type,
        surah_number,
        start_ayah_number,
        end_ayah_number,
        page_number,
        status
      )
    `,
    )
    .eq("user_id", user.id)
    .eq("memorization.status", "memorized")
    .order("next_review_at", { ascending: true });

  if (error || !data) {
    return { ok: false };
  }

  return {
    ok: true,
    items: (data as ReviewWithMemorization[])
      .map(toScheduleItem)
      .filter((item): item is ReviewScheduleItem => item !== null),
  };
}

/** Existing callers keep an empty list when the query fails. */
async function listReviewSchedules(options?: {
  skipEnsure?: boolean;
}): Promise<ReviewScheduleItem[]> {
  const result = await loadReviewSchedules(options);
  return result.ok ? result.items : [];
}

/**
 * Due-now count for Home. Pass skipEnsure so Home never inserts review rows.
 * dueNow matches the review session (`next_review_at <= now`).
 */
export async function getDueReviewSnapshot(options?: {
  skipEnsure?: boolean;
}): Promise<
  { ok: true; dueNow: number; scheduled: number } | { ok: false }
> {
  const result = await loadReviewSchedules(options);
  if (!result.ok) {
    return { ok: false };
  }

  return {
    ok: true,
    dueNow: summarizeReviewCounts(result.items).dueNow,
    scheduled: result.items.length,
  };
}

/** Due for a review session: next_review_at <= now. */
export async function listDueReviews(
  now: Date = new Date(),
): Promise<ReviewScheduleItem[]> {
  const items = await listReviewSchedules();
  const nowMs = now.getTime();
  return items.filter(
    (item) => new Date(item.nextReviewAt).getTime() <= nowMs,
  );
}

export async function listUpcomingReviews(
  now: Date = new Date(),
  limit = 10,
): Promise<ReviewScheduleItem[]> {
  const items = await listReviewSchedules();
  const endToday = endOfUtcDay(now).getTime();
  return items
    .filter((item) => new Date(item.nextReviewAt).getTime() >= endToday)
    .slice(0, limit);
}

export async function listRecentlyReviewed(
  limit = 8,
): Promise<ReviewScheduleItem[]> {
  const items = await listReviewSchedules();
  return items
    .filter((item) => item.lastReviewedAt != null)
    .sort((a, b) => {
      const aTime = new Date(a.lastReviewedAt!).getTime();
      const bTime = new Date(b.lastReviewedAt!).getTime();
      return bTime - aTime;
    })
    .slice(0, limit);
}

/**
 * Dashboard counts (UTC calendar day for overdue / due today / upcoming).
 * dueNow = next_review_at <= now (session-eligible).
 */
export function summarizeReviewCounts(
  items: ReviewScheduleItem[],
  now: Date = new Date(),
): ReviewDashboardCounts {
  const nowMs = now.getTime();
  const startToday = startOfUtcDay(now).getTime();
  const endToday = endOfUtcDay(now).getTime();

  let overdue = 0;
  let dueToday = 0;
  let upcoming = 0;
  let dueNow = 0;

  for (const item of items) {
    const nextMs = new Date(item.nextReviewAt).getTime();
    if (nextMs <= nowMs) {
      dueNow += 1;
    }
    if (nextMs < startToday) {
      overdue += 1;
    } else if (nextMs < endToday) {
      dueToday += 1;
    } else {
      upcoming += 1;
    }
  }

  return { overdue, dueToday, upcoming, dueNow };
}

export async function getReviewDashboardCounts(
  now: Date = new Date(),
): Promise<ReviewDashboardCounts> {
  const items = await listReviewSchedules();
  return summarizeReviewCounts(items, now);
}

/** Single sync + load for the Review dashboard page. */
export async function loadReviewDashboard(now: Date = new Date()) {
  const items = await listReviewSchedules();
  const counts = summarizeReviewCounts(items, now);
  const startToday = startOfUtcDay(now).getTime();
  const endToday = endOfUtcDay(now).getTime();

  const overdue = items.filter(
    (item) => new Date(item.nextReviewAt).getTime() < startToday,
  );
  const dueToday = items.filter((item) => {
    const nextMs = new Date(item.nextReviewAt).getTime();
    return nextMs >= startToday && nextMs < endToday;
  });
  const upcoming = items
    .filter((item) => new Date(item.nextReviewAt).getTime() >= endToday)
    .slice(0, 8);
  const recent = items
    .filter((item) => item.lastReviewedAt != null)
    .sort((a, b) => {
      const aTime = new Date(a.lastReviewedAt!).getTime();
      const bTime = new Date(b.lastReviewedAt!).getTime();
      return bTime - aTime;
    })
    .slice(0, 6);

  return { counts, overdue, dueToday, upcoming, recent };
}

/** Due today list for dashboard (UTC day window). */
export async function listDueTodayReviews(
  now: Date = new Date(),
): Promise<ReviewScheduleItem[]> {
  const items = await listReviewSchedules();
  const startToday = startOfUtcDay(now).getTime();
  const endToday = endOfUtcDay(now).getTime();
  return items.filter((item) => {
    const nextMs = new Date(item.nextReviewAt).getTime();
    return nextMs >= startToday && nextMs < endToday;
  });
}

export async function listOverdueReviews(
  now: Date = new Date(),
): Promise<ReviewScheduleItem[]> {
  const items = await listReviewSchedules();
  const startToday = startOfUtcDay(now).getTime();
  return items.filter(
    (item) => new Date(item.nextReviewAt).getTime() < startToday,
  );
}
