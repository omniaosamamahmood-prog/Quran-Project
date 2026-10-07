"use client";

import { supabase } from "@/lib/supabase/client";
import {
  MEMORIZATION_ROW_COLUMNS,
  type MemorizationRow,
} from "@/types/memorization";

/**
 * Memorization rows for the signed-in browser session.
 * Empty for guests and when the query fails. RLS still scopes the rows.
 */
export async function loadSessionMemorizationRows(): Promise<MemorizationRow[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return [];
  }

  const { data, error } = await supabase
    .from("memorization")
    .select(MEMORIZATION_ROW_COLUMNS)
    .eq("user_id", session.user.id);

  if (error || !data) {
    return [];
  }

  return data as MemorizationRow[];
}
