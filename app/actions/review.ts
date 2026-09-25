"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  computeNextReviewAt,
  isReviewRating,
  type ReviewRating,
} from "@/types/review";

export type ReviewActionResult =
  | { ok: true }
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
        | "not_due";
      code?: string;
      operation?: string;
    };

async function revalidateReview() {
  const locale = await getLocale();
  revalidatePath(`/${locale}/review`);
  revalidatePath(`/${locale}/review`, "layout");
  revalidatePath(`/${locale}/memorization`);
}

function mapWriteError(
  code: string | undefined,
  operation: string,
): ReviewActionResult & { ok: false } {
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

/**
 * Record a self-rating for a due review (Difficult / Good / Easy).
 * Never trusts client user_id. Never touches profiles.
 */
export async function submitReviewRating(
  reviewId: number,
  rating: string,
): Promise<ReviewActionResult> {
  const id = Number(reviewId);
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: "invalid" };
  }
  if (!isReviewRating(rating)) {
    return { ok: false, error: "invalid" };
  }

  const selected: ReviewRating = rating;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "auth_required", operation: "auth.getUser" };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("memorization_reviews")
    .select(
      `
      id,
      review_count,
      next_review_at,
      memorization!inner (
        status
      )
    `,
    )
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle();

  if (lookupError) {
    return mapWriteError(lookupError.code, "SELECT");
  }

  if (!existing) {
    return { ok: false, error: "not_found", operation: "SELECT" };
  }

  const memo = existing.memorization as
    | { status: string }
    | { status: string }[]
    | null;
  const status = Array.isArray(memo) ? memo[0]?.status : memo?.status;
  if (status !== "memorized") {
    return { ok: false, error: "invalid", operation: "eligibility" };
  }

  const now = new Date();
  if (new Date(existing.next_review_at as string).getTime() > now.getTime()) {
    return { ok: false, error: "not_due", operation: "eligibility" };
  }

  const { intervalDays, nextReviewAt } = computeNextReviewAt(selected, now);
  const previousCount = Number(existing.review_count) || 0;

  const { data: updated, error: updateError } = await supabase
    .from("memorization_reviews")
    .update({
      last_reviewed_at: now.toISOString(),
      next_review_at: nextReviewAt,
      review_count: previousCount + 1,
      last_rating: selected,
      interval_days: intervalDays,
      updated_at: now.toISOString(),
    })
    .eq("user_id", user.id)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return mapWriteError(updateError.code, "UPDATE");
  }

  if (!updated) {
    return { ok: false, error: "not_found", operation: "UPDATE" };
  }

  await revalidateReview();
  return { ok: true };
}
