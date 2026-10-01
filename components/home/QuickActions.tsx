import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  ArrowIcon,
  BookIcon,
  HeadphonesIcon,
  LeafIcon,
  MemorizeIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const ACTIONS = [
  { href: "/quran", key: "read", icon: BookIcon, primary: true },
  { href: "/listen", key: "listen", icon: HeadphonesIcon, primary: false },
  { href: "/adhkar", key: "adhkar", icon: LeafIcon, primary: false },
  { href: "/memorization", key: "memorize", icon: MemorizeIcon, primary: false },
] as const;

export async function QuickActions() {
  const t = await getTranslations("Home.quickActions");
  const isArabic = (await getLocale()) === "ar";

  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="sr-only">
        {t("label")}
      </h2>

      <div className="grid grid-cols-2 items-start gap-3 sm:gap-4 lg:grid-cols-4">
        {ACTIONS.map(({ href, key, icon: Icon, primary }) => (
          <Link
            key={key}
            href={href}
            className={cn(
              "group rounded-2xl border p-3.5 transition-colors duration-200 sm:p-4",
              primary
                ? "border-emerald bg-emerald text-white shadow-lift hover:bg-emerald-deep"
                : "border-line bg-surface shadow-card hover:border-emerald/25",
            )}
          >
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  primary ? "bg-white/12 text-gold-soft" : "bg-sage text-emerald",
                )}
              >
                <Icon className="h-[1.125rem] w-[1.125rem]" />
              </span>
              <span
                className={cn(
                  "min-w-0 font-semibold leading-snug",
                  primary ? "text-white" : "text-ink",
                  isArabic ? "text-[1rem]" : "text-[0.9375rem]",
                )}
              >
                {t(`${key}.title`)}
              </span>
              <ArrowIcon
                className={cn(
                  "h-3.5 w-3.5 shrink-0 rtl:rotate-180",
                  primary ? "text-gold-soft" : "text-emerald",
                )}
              />
            </span>
            <span
              className={cn(
                "mt-2 block text-[0.8125rem] leading-snug",
                primary ? "text-white/75" : "text-muted",
              )}
            >
              {t(`${key}.description`)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
