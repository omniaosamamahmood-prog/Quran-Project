import { createClient } from "@/lib/supabase/server";
import { favoriteKey, type FavoriteRow } from "@/types/favorites";

export async function listFavorites(): Promise<FavoriteRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("id, user_id, surah_number, ayah_number, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as FavoriteRow[];
}

/** All favorite keys for the authenticated user (empty set for guests). */
export async function getFavoriteKeySet(): Promise<Set<string>> {
  const rows = await listFavorites();
  return new Set(
    rows.map((row) => favoriteKey(row.surah_number, row.ayah_number)),
  );
}
