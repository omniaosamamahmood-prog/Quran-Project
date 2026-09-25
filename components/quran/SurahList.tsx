"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowIcon, SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { SurahSummary } from "@/types/quran";

type SurahListProps = {
  /** Metadata only — ayah text never reaches the client. */
  surahs: SurahSummary[];
};

/**
 * Folds Arabic letter variants for matching only. The surah names themselves
 * are always rendered exactly as they come from the dataset.
 */
function normalizeForSearch(value: string): string {
  return value
    .replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0640/g, "")
    .toLowerCase()
    .trim();
}

/** Accepts Arabic-Indic digits when searching by surah number. */
function toLatinDigits(value: string): string {
  return value.replace(/[\u0660-\u0669]/g, (digit) =>
    String(digit.charCodeAt(0) - 0x0660),
  );
}

export function SurahList({ surahs }: SurahListProps) {
  const t = useTranslations("Quran");
  const isArabic = useLocale() === "ar";
  const [query, setQuery] = useState("");

  const indexed = useMemo(
    () =>
      surahs.map((surah) => ({
        ...surah,
        searchKey: normalizeForSearch(surah.name),
      })),
    [surahs],
  );

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed === "") return indexed;

    const needle = normalizeForSearch(trimmed);
    const digits = toLatinDigits(trimmed);

    return indexed.filter(
      (surah) =>
        surah.searchKey.includes(needle) ||
        String(surah.number).startsWith(digits),
    );
  }, [indexed, query]);

  return (
    <div>
      <div className="relative mt-7 max-w-md">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute start-4 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          className="h-12 w-full rounded-full border border-line bg-surface ps-12 pe-5 text-sm text-ink shadow-card transition-colors placeholder:text-muted hover:border-emerald/25 focus:border-emerald/40 focus:outline-none"
        />
      </div>

      {results.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {results.map((surah) => (
            <li key={surah.number}>
              <Link
                href={`/quran/page/${surah.firstPage}`}
                className="group flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald/25 hover:shadow-lift sm:p-4"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line-soft bg-sage text-[0.9375rem] font-semibold text-emerald transition-colors group-hover:bg-sage-deep">
                  {surah.number}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    lang="ar"
                    className="block truncate font-naskh text-[1.1875rem] leading-[1.7] text-ink"
                  >
                    {surah.name}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[0.8125rem] text-muted",
                      isArabic && "leading-relaxed",
                    )}
                  >
                    {surah.ayahCount}{" "}
                    {t("ayahUnit", { count: surah.ayahCount })}
                  </span>
                </span>

                {/* Size comes from the icon default: `cn` does not merge
                    conflicting Tailwind classes, so an override here would be
                    dead weight. */}
                <ArrowIcon
                  aria-hidden
                  className="shrink-0 text-emerald/35 transition-all duration-200 group-hover:text-emerald group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
