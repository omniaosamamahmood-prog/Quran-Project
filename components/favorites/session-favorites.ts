"use client";

import { supabase } from "@/lib/supabase/client";
import { favoriteKey } from "@/types/favorites";

/**
 * Favorite keys for the signed-in browser session.
 * Empty for guests and when the query fails. RLS still scopes the rows.
 */
export async function loadSessionFavoriteKeys(): Promise<Set<string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return new Set();
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("surah_number, ayah_number")
    .eq("user_id", session.user.id);

  if (error || !data) {
    return new Set();
  }

  return new Set(
    data.map((row) => favoriteKey(row.surah_number, row.ayah_number)),
  );
}
