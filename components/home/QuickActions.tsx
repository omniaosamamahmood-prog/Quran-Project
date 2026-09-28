import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  ArrowIcon,
  BookIcon,
  HeadphonesIcon,
  MemorizeIcon,
  ReviewIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const ACTIONS = [
  { href: "/quran", key: "read", icon: BookIcon, primary: true },
  { href: "/listen", key: "listen", icon: HeadphonesIcon, primary: false },
  { href: "/memorization", key: "memorize", icon: MemorizeIcon, primary: false },
  { href: "/review", key: "review", icon: ReviewIcon, primary: false },
] as const;

export async function QuickActions() {
  const t = await getTranslations("Home.quickActions");
  const isArabic = (await getLocale()) === "ar";

  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="sr-only">
        {t("label")}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {ACTIONS.map(({ href, key, icon: Icon, primary }) => (
          <Link
            key={key}
            href={href}
            className={cn(
              "group flex min-h-[8.75rem] flex-col rounded-2xl border p-4 transition-all duration-200 sm:p-5",
              primary
                ? "border-emerald bg-emerald text-white shadow-lift hover:bg-emerald-deep"
                : "border-line bg-surface shadow-card hover:-translate-y-0.5 hover:border-emerald/25 hover:shadow-lift",
            )}
          >
            <span
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                primary
                  ? "bg-white/12 text-gold-soft"
                  : "bg-sage text-emerald group-hover:bg-sage-deep",
              )}
            >
              <Icon />
            </span>

            <p
              className={cn(
                "mt-3.5 font-semibold",
                primary ? "text-white" : "text-ink",
                isArabic ? "text-[1.0625rem]" : "text-[0.9375rem]",
              )}
            >
              {t(`${key}.title`)}
            </p>
            <p
              className={cn(
                "mt-1 text-[0.8125rem] leading-relaxed",
                primary ? "text-white/70" : "text-muted",
              )}
            >
              {t(`${key}.description`)}
            </p>

            <span
              aria-hidden
              className={cn(
                "mt-auto ms-auto inline-flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200",
                primary
                  ? "border-white/25 bg-white/10 text-gold-soft"
                  : "border-line bg-canvas/60 text-emerald group-hover:border-emerald/30 group-hover:bg-sage",
              )}
            >
              <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
