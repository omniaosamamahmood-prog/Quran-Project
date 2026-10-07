import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/proxy";

const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  return updateSession(request, response);
}

export const config = {
  // `auth/` stays outside next-intl. Otherwise `/auth/callback` is redirected
  // to `/{locale}/auth/callback` and the OAuth code exchange never runs.
  matcher: "/((?!api|trpc|_next|_vercel|auth/|.*\\..*).*)",
};
