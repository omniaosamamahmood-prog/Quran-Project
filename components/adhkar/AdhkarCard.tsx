import { getLocale, getTranslations } from "next-intl/server";
import { AdhkarCounter } from "@/components/adhkar/AdhkarCounter";
import { cn } from "@/lib/cn";
import type { AdhkarItem } from "@/types/adhkar";

type AdhkarCardProps = {
  item: AdhkarItem;
  index: number;
};

export async function AdhkarCard({ item, index }: AdhkarCardProps) {
  const t = await getTranslations("Adhkar");
  const locale = await getLocale();
  const isArabicUi = locale === "ar";
  const showTranslation = locale === "en" && Boolean(item.translation);

  return (
    <article className="rounded-2xl border border-line bg-surface px-4 py-5 shadow-card sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p
          className={cn(
            "text-xs font-medium tracking-wide text-muted",
            isArabicUi && "leading-relaxed",
          )}
        >
          {t("card.number", { number: index + 1 })}
        </p>
        {item.repeat != null ? (
          <p className="text-xs font-medium text-emerald-muted">
            {t("card.repeatTarget", { count: item.repeat })}
          </p>
        ) : null}
      </div>

      {item.title ? (
        <h3
          className={cn(
            "mb-3 text-sm font-semibold text-emerald-deep",
            isArabicUi && "font-naskh leading-relaxed",
          )}
        >
          {item.title}
        </h3>
      ) : null}

      <p
        lang="ar"
        dir="rtl"
        className="font-naskh text-[1.25rem] leading-[2.05] text-ink sm:text-[1.35rem] sm:leading-[2.15]"
      >
        {item.arabic}
      </p>

      {showTranslation ? (
        <p
          lang="en"
          dir="ltr"
          className="mt-4 border-t border-line-soft pt-4 text-sm leading-relaxed text-muted"
        >
          {item.translation}
        </p>
      ) : null}

      {item.reference ? (
        <p
          className={cn(
            "mt-3 text-xs text-muted",
            isArabicUi && "leading-relaxed",
          )}
        >
          {t("card.reference", { reference: item.reference })}
        </p>
      ) : null}

      {item.repeat != null ? (
        <div className="mt-4 border-t border-line-soft pt-4">
          <AdhkarCounter target={item.repeat} />
        </div>
      ) : null}
    </article>
  );
}
