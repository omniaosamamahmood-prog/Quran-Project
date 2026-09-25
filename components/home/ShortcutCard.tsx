import type { ComponentType } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type ShortcutCardProps = {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "surface" | "sage";
  isArabic: boolean;
};

export function ShortcutCard({
  href,
  title,
  description,
  icon: Icon,
  tone = "surface",
  isArabic,
}: ShortcutCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[7.5rem] flex-col rounded-2xl border p-4 transition-all duration-200 sm:p-5",
        tone === "sage"
          ? "border-sage-deep bg-sage hover:border-emerald/25"
          : "border-line bg-surface shadow-card hover:border-emerald/25 hover:shadow-lift",
        "hover:-translate-y-0.5",
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line-soft bg-surface text-emerald">
          <Icon className="h-5 w-5" />
          <span
            aria-hidden
            className="absolute -end-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-gold/70"
          />
        </span>

        <div className="min-w-0">
          <p
            className={cn(
              "font-semibold text-ink",
              isArabic ? "text-[1.0625rem]" : "text-[0.9375rem]",
            )}
          >
            {title}
          </p>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">
            {description}
          </p>
        </div>
      </div>

      <span
        aria-hidden
        className="mt-auto ms-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-line bg-canvas/60 text-emerald transition-colors group-hover:border-emerald/30 group-hover:bg-sage"
      >
        <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
      </span>
    </Link>
  );
}
