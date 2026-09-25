import type { MemorizationUnitType } from "@/types/memorization";

export type ReviewRating = "difficult" | "good" | "easy";

export type MemorizationReviewRow = {
  id: number;
  user_id: string;
  memorization_id: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  review_count: number;
  last_rating: ReviewRating | null;
  interval_days: number;
  created_at: string;
  updated_at: string;
};

/** Review row joined with memorization unit refs (no Quran text). */
export type ReviewScheduleItem = {
  reviewId: number;
  memorizationId: number;
  unitType: MemorizationUnitType;
  surahNumber: number;
  startAyahNumber: number;
  endAyahNumber: number | null;
  pageNumber: number | null;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  reviewCount: number;
  lastRating: ReviewRating | null;
  intervalDays: number;
};

export type ReviewDashboardCounts = {
  overdue: number;
  dueToday: number;
  upcoming: number;
  /** Eligible for a review session right now (`next_review_at <= now`). */
  dueNow: number;
};

export const REVIEW_INTERVAL_DAYS: Record<ReviewRating, number> = {
  difficult: 1,
  good: 3,
  easy: 7,
};

export function isReviewRating(value: string): value is ReviewRating {
  return value === "difficult" || value === "good" || value === "easy";
}

/** next_review_at = now + interval_days (exact V1 intervals). */
export function computeNextReviewAt(
  rating: ReviewRating,
  from: Date = new Date(),
): { intervalDays: number; nextReviewAt: string } {
  const intervalDays = REVIEW_INTERVAL_DAYS[rating];
  const next = new Date(from.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return { intervalDays, nextReviewAt: next.toISOString() };
}
