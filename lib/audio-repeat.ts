/** Repeat counts offered in memorization practice. */
export const MEMORIZATION_REPEAT_COUNTS = [1, 3, 5, 10] as const;

export type MemorizationRepeatCount = (typeof MEMORIZATION_REPEAT_COUNTS)[number];

export type RepeatSession = {
  surahNumber: number;
  ayahNumber: number;
  /** Plays still left, including the one currently playing. */
  remaining: number;
};

export function isMemorizationRepeatCount(
  value: number,
): value is MemorizationRepeatCount {
  return (MEMORIZATION_REPEAT_COUNTS as readonly number[]).includes(value);
}

/** A bounded repeat of one ayah. Any other count is not a memorization session. */
export function createRepeatSession(
  surahNumber: number,
  ayahNumber: number,
  repeatCount: number,
): RepeatSession | null {
  if (!isMemorizationRepeatCount(repeatCount)) return null;
  return { surahNumber, ayahNumber, remaining: repeatCount };
}

export function consumeRepeatPlay(session: RepeatSession): RepeatSession {
  return { ...session, remaining: session.remaining - 1 };
}

/**
 * What the player should do when the current ayah audio ends.
 * `passthrough` leaves normal continuous playback untouched.
 */
export function repeatOnEnded(
  session: RepeatSession | null,
  track: { surahNumber: number; ayahNumber: number } | null,
): "replay" | "stop" | "passthrough" {
  if (!session || !track) return "passthrough";
  if (
    session.surahNumber !== track.surahNumber ||
    session.ayahNumber !== track.ayahNumber
  ) {
    return "passthrough";
  }
  if (session.remaining > 1) return "replay";
  return "stop";
}
