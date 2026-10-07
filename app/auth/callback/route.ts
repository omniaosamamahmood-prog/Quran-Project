import { type NextRequest, NextResponse } from "next/server";
import {
  getSafeInternalPath,
  localeFromInternalPath,
} from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";

function loginWithError(
  request: NextRequest,
  locale: string,
  reason: "oauth" | "oauth_cancelled",
) {
  return NextResponse.redirect(
    new URL(`/${locale}/login?error=${reason}`, request.url),
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = searchParams.get("next");
  const locale = localeFromInternalPath(next);
  const providerError = searchParams.get("error");
  const code = searchParams.get("code");

  if (providerError || !code) {
    const cancelled =
      providerError === "access_denied" ||
      searchParams.get("error_code") === "access_denied";

    return loginWithError(
      request,
      locale,
      cancelled ? "oauth_cancelled" : "oauth",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return loginWithError(request, locale, "oauth");
  }

  const destination = getSafeInternalPath(next, locale);
  return NextResponse.redirect(new URL(destination, request.url));
}
