"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type SearchHit = {
  itemId: string;
  categorySlug: string;
  categoryTitle: string;
  arabic: string;
  translation: string | null;
};

type AdhkarSearchProps = {
  hits: SearchHit[];
};

export function AdhkarSearch({ hits }: AdhkarSearchProps) {
  const t = useTranslations("Adhkar");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());

  const results = useMemo(() => {
    if (!deferred) return [];
    return hits
      .filter((hit) => {
        const fields = [
          hit.arabic,
          hit.translation ?? "",
          hit.categoryTitle,
        ].map((value) => value.toLowerCase());
        return (
          fields.some((value) => value.includes(deferred)) ||
          hit.arabic.includes(query.trim())
        );
      })
      .slice(0, 24);
  }, [deferred, hits, query]);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="sr-only">{t("search.label")}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
          className={cn(
            "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-card",
            "placeholder:text-muted/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/30",
            isArabic && "leading-relaxed",
          )}
        />
      </label>

      {query.trim() ? (
        <div className="rounded-2xl border border-line bg-surface/90 p-3 sm:p-4">
          {results.length === 0 ? (
            <p className="text-sm text-muted">{t("search.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {results.map((hit) => (
                <li key={hit.itemId}>
                  <Link
                    href={`/adhkar/${hit.categorySlug}#${hit.itemId}`}
                    className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-sage/60"
                  >
                    <p
                      className={cn(
                        "text-xs font-medium text-emerald-deep",
                        isArabic && "font-naskh",
                      )}
                    >
                      {hit.categoryTitle}
                    </p>
                    <p
                      lang="ar"
                      dir="rtl"
                      className="mt-1 line-clamp-2 font-naskh text-[1.05rem] leading-relaxed text-ink"
                    >
                      {hit.arabic}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
