"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ChevronDownIcon, GlobeIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Navigation");

  const switchLanguage = () => {
    router.replace(pathname, {
      locale: locale === "ar" ? "en" : "ar",
    });
  };

  return (
    <button
      type="button"
      onClick={switchLanguage}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:border-emerald/30 hover:bg-sage",
        className,
      )}
    >
      <GlobeIcon className="h-[1.0625rem] w-[1.0625rem] text-emerald" />
      <span className={cn(locale === "en" && "font-arabic")}>
        {t("languageSwitchLabel")}
      </span>
      <ChevronDownIcon className="h-4 w-4 text-muted" />
    </button>
  );
}
