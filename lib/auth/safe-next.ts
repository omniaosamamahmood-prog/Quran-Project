import { routing } from "@/i18n/routing";

const PATH_SEGMENT = String.raw`[\w./~%-]*`;
const HASH_SEGMENT = String.raw`[\w./~%-]*`;

/**
 * Returns a safe same-origin internal path for post-login redirect.
 * Prefixed with locale (e.g. "/ar/favorites"). Rejects external URLs.
 * Optional hash fragments (e.g. "#ayah-2-255") are preserved when safe.
 */
export function getSafeInternalPath(
  next: string | null | undefined,
  locale: string,
): string {
  const fallback = `/${locale}`;

  if (!next) {
    return fallback;
  }

  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("://") ||
    next.includes("\\") ||
    /[\0\r\n]/.test(next)
  ) {
    return fallback;
  }

  const localePrefixed = new RegExp(
    `^/(${routing.locales.join("|")})(/${PATH_SEGMENT})?(#${HASH_SEGMENT})?$`,
  );

  if (localePrefixed.test(next)) {
    return next;
  }

  // Locale-less app path, e.g. "/favorites" or "/quran/page/5#ayah-1-1"
  if (new RegExp(`^/${PATH_SEGMENT}(#${HASH_SEGMENT})?$`).test(next)) {
    const [pathname = "/", hash = ""] = next.split("#");
    const prefixed =
      pathname === "/" ? fallback : `/${locale}${pathname}`;
    return hash ? `${prefixed}#${hash}` : prefixed;
  }

  return fallback;
}

/**
 * Convert a locale-prefixed path to a next-intl href (no locale prefix).
 * Preserves a safe hash fragment when present.
 */
export function toAppHref(path: string, locale: string): string {
  const hashIndex = path.indexOf("#");
  const pathname = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : path.slice(hashIndex);

  const prefix = `/${locale}`;
  let href: string;

  if (pathname === prefix || pathname === `${prefix}/`) {
    href = "/";
  } else if (pathname.startsWith(`${prefix}/`)) {
    href = pathname.slice(prefix.length);
  } else {
    href = pathname.startsWith("/") ? pathname : `/${pathname}`;
  }

  return `${href}${hash}`;
}
