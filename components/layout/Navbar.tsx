"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { Container } from "@/components/ui/Container";
import { UserIcon } from "@/components/ui/icons";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, isNavActive } from "@/lib/nav";
import { supabase } from "@/lib/supabase/client";

export type NavbarUser = {
  fullName: string | null;
  email: string | null;
} | null;

type NavbarProps = {
  user: NavbarUser;
};

export default function Navbar({ user }: NavbarProps) {
  const t = useTranslations("Navigation");
  const tBrand = useTranslations("Brand");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const isArabic = locale === "ar";

  const displayName = user?.fullName?.trim() || user?.email || null;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/92 backdrop-blur-md">
      <Container className="flex h-[4.25rem] items-center gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <BrandMark />
          <span className="flex min-w-0 flex-col leading-tight">
            <span
              className={cn(
                "truncate font-semibold text-ink",
                isArabic
                  ? "font-naskh text-[1.125rem]"
                  : "text-[0.9375rem] tracking-tight",
              )}
            >
              {tBrand("name")}
            </span>
            <span className="truncate text-[0.6875rem] tracking-wide text-muted">
              {tBrand("secondary")}
            </span>
          </span>
        </Link>

        <nav
          aria-label={t("primary")}
          className="hidden h-full flex-1 items-stretch justify-center lg:flex"
        >
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center px-4 text-sm transition-colors",
                  active
                    ? "font-semibold text-emerald"
                    : "text-muted hover:text-ink",
                )}
              >
                {t(item.key)}
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-4 bottom-0 h-[2.5px] rounded-full bg-emerald"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 shrink-0 items-center justify-end gap-2 lg:flex-none">
          <LanguageSwitcher />

          {user ? (
            <div className="flex min-w-0 items-center gap-2">
              {displayName ? (
                <p
                  className="hidden max-w-[9rem] truncate text-sm text-muted sm:block"
                  title={displayName}
                >
                  {displayName}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                aria-label={t("logout")}
                className="inline-flex h-10 items-center justify-center rounded-full bg-emerald px-3.5 text-sm font-medium text-white transition-colors hover:bg-emerald-deep"
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              aria-label={t("account")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald text-white transition-colors hover:bg-emerald-deep"
            >
              <UserIcon className="h-[1.125rem] w-[1.125rem]" />
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}
