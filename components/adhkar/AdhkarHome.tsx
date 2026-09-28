import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AdhkarSearch } from "@/components/adhkar/AdhkarSearch";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import {
  FEATURED_ADHKAR,
  getAdhkarCategories,
  getAdhkarItems,
  getAdhkarMeta,
  getCategoryBySlug,
  getCategoryTitle,
} from "@/lib/adhkar";

export async function AdhkarHome() {
  const t = await getTranslations("Adhkar");
  const locale = await getLocale();
  const isArabic = locale === "ar";
  const meta = getAdhkarMeta();
  const categories = getAdhkarCategories();
  const items = getAdhkarItems();

  const featured = FEATURED_ADHKAR.map((entry) => {
    if (!entry.slug) {
      return {
        key: entry.key,
        href: "/adhkar#all-categories",
        title: t(`featured.${entry.key}.title`),
        description: t(`featured.${entry.key}.description`),
        countLabel: t("featured.collectionCount", { count: categories.length }),
      };
    }

    const category = getCategoryBySlug(entry.slug);
    return {
      key: entry.key,
      href: `/adhkar/${entry.slug}`,
      title: t(`featured.${entry.key}.title`),
      description: t(`featured.${entry.key}.description`),
      countLabel: category
        ? t("category.count", { count: category.itemCount })
        : "",
    };
  });

  const searchHits = items.flatMap((item) => {
    const category = categories.find((entry) => entry.id === item.categoryId);
    if (!category) return [];
    return [
      {
        itemId: item.id,
        categorySlug: category.slug,
        categoryTitle: getCategoryTitle(category, locale),
        arabic: item.arabic,
        translation: item.translation ?? null,
      },
    ];
  });

  return (
    <main id="main" className="py-8 sm:py-12">
      <Container className="max-w-[52rem]">
        <header className="mb-8 border-b border-line pb-7">
          <h1
            className={cn(
              "text-emerald",
              isArabic
                ? "font-naskh text-[1.9rem] leading-[1.5]"
                : "font-display text-3xl tracking-tight",
            )}
          >
            {t("title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            {t("subtitle")}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted/90">
            {t("attribution", {
              source: isArabic ? meta.sourceName : meta.contentBasis,
              author: isArabic ? meta.sourceAuthorAr : meta.sourceAuthorEn,
            })}
          </p>
        </header>

        <section className="mb-10" aria-labelledby="adhkar-search-heading">
          <h2 id="adhkar-search-heading" className="sr-only">
            {t("search.label")}
          </h2>
          <AdhkarSearch hits={searchHits} />
        </section>

        <section className="mb-12" aria-labelledby="adhkar-featured-heading">
          <h2
            id="adhkar-featured-heading"
            className={cn(
              "mb-4 text-lg font-semibold text-emerald-deep",
              isArabic ? "font-naskh leading-relaxed" : "font-display",
            )}
          >
            {t("featured.heading")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {featured.map((card) => (
              <li key={card.key}>
                <Link
                  href={card.href}
                  className="flex h-full flex-col rounded-2xl border border-line bg-surface px-4 py-4 shadow-card transition-colors hover:border-emerald/25 hover:bg-sage/40 sm:px-5"
                >
                  <span
                    className={cn(
                      "text-base font-semibold text-emerald-deep",
                      isArabic && "font-naskh leading-relaxed",
                    )}
                  >
                    {card.title}
                  </span>
                  <span className="mt-1.5 text-sm leading-relaxed text-muted">
                    {card.description}
                  </span>
                  {card.countLabel ? (
                    <span className="mt-3 text-xs font-medium text-emerald-muted">
                      {card.countLabel}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="all-categories" aria-labelledby="adhkar-all-heading">
          <h2
            id="adhkar-all-heading"
            className={cn(
              "mb-2 text-lg font-semibold text-emerald-deep",
              isArabic ? "font-naskh leading-relaxed" : "font-display",
            )}
          >
            {t("all.heading")}
          </h2>
          <p className="mb-5 text-sm leading-relaxed text-muted">
            {t("all.description")}
          </p>
          <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-surface">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/adhkar/${category.slug}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-sage/50 sm:px-5"
                >
                  <span
                    className={cn(
                      "min-w-0 text-sm font-medium text-ink",
                      isArabic && "font-naskh leading-relaxed",
                    )}
                  >
                    {getCategoryTitle(category, locale)}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {t("category.count", { count: category.itemCount })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-muted/80">
          {t("verificationNote")}
        </p>
      </Container>
    </main>
  );
}
