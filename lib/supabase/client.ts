import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — session is stored in cookies so the server
 * client (`lib/supabase/server.ts`) can read the same auth state.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
