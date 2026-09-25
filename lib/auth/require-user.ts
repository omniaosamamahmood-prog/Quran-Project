import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side gate for user-specific pages.
 * `pathnameWithoutLocale` is the app path, e.g. "/favorites".
 */
export async function requireUser(pathnameWithoutLocale: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    const path = pathnameWithoutLocale.startsWith("/")
      ? pathnameWithoutLocale
      : `/${pathnameWithoutLocale}`;
    const next = `/${locale}${path}`;
    redirect(`/${locale}/login?next=${encodeURIComponent(next)}`);
  }

  return user;
}
