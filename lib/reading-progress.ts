import { createClient } from "@/lib/supabase/server";
import type { ReadingProgressRow } from "@/types/reading-progress";

export type ReadingProgressResult =
  | { status: "empty" }
  | { status: "ready"; progress: ReadingProgressRow }
  | { status: "error" };

/**
 * Authenticated user's single reading position.
 * Empty for guests and for users with no row. Never invents progress.
 * Does not touch public.profiles.
 */
export async function getReadingProgress(): Promise<ReadingProgressResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "empty" };
  }

  const { data, error } = await supabase
    .from("reading_progress")
    .select("user_id, surah_number, ayah_number, page_number, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { status: "error" };
  }

  if (!data) {
    return { status: "empty" };
  }

  return { status: "ready", progress: data as ReadingProgressRow };
}
