import { createClient } from "@/lib/supabase/server";
import type { ReadingProgressRow } from "@/types/reading-progress";

/**
 * Authenticated user's single reading position, or null for guests / no row.
 * Never invents progress. Does not touch public.profiles.
 */
export async function getReadingProgress(): Promise<ReadingProgressRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("reading_progress")
    .select("user_id, surah_number, ayah_number, page_number, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ReadingProgressRow;
}
