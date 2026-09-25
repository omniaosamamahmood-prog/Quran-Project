"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  BookIcon,
  HeartIcon,
  HomeIcon,
  MemorizeIcon,
  SparkIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, isNavActive, type NavItemKey } from "@/lib/nav";

const NAV_ICONS: Record<NavItemKey, typeof HomeIcon> = {
  home: HomeIcon,
  quran: BookIcon,
  memorization: MemorizeIcon,
  favorites: HeartIcon,
  adhkar: SparkIcon,
};

export default function MobileNavigation() {
  const t = useTranslations("Navigation");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("primary")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_-22px_rgb(16_42_35_/_0.5)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.key];
          const active = isNavActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.75rem] flex-col items-center justify-center gap-1.5 px-1 text-[0.6875rem] leading-none transition-colors",
                  active ? "text-emerald" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-10 items-center justify-center rounded-lg transition-colors",
                    active && "bg-sage",
                  )}
                >
                  <Icon className="h-[1.3125rem] w-[1.3125rem]" />
                </span>
                <span
                  className={cn(
                    "max-w-full truncate",
                    active && "font-semibold",
                  )}
                >
                  {t(item.key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
