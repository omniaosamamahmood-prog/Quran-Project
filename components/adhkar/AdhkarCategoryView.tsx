import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AdhkarCard } from "@/components/adhkar/AdhkarCard";
import { Container } from "@/components/ui/Container";
import { ArrowIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import {
  getCategoryBySlug,
  getCategoryTitle,
  getItemsByCategorySlug,
} from "@/lib/adhkar";

type AdhkarCategoryViewProps = {
  slug: string;
};

export async function AdhkarCategoryView({ slug }: AdhkarCategoryViewProps) {
  const category = getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const t = await getTranslations("Adhkar");
  const locale = await getLocale();
  const isArabic = locale === "ar";
  const items = getItemsByCategorySlug(slug);
  const title = getCategoryTitle(category, locale);

  return (
    <main id="main" className="py-8 sm:py-12">
      <Container className="max-w-[46rem]">
        <nav className="mb-6">
          <Link
            href="/adhkar"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-emerald"
          >
            <ArrowIcon className="rotate-180 rtl:rotate-0" />
            {t("back")}
          </Link>
        </nav>

        <header className="mb-8 border-b border-line pb-6">
          <h1
            className={cn(
              "text-emerald",
              isArabic
                ? "font-naskh text-[1.75rem] leading-[1.5]"
                : "font-display text-[1.75rem] tracking-tight sm:text-3xl",
            )}
          >
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t("category.count", { count: items.length })}
          </p>
          {slug === "morning-evening" ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t("category.morningEveningNote")}
            </p>
          ) : null}
        </header>

        {items.length === 0 ? (
          <p className="text-sm text-muted">{t("category.empty")}</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item, index) => (
              <li key={item.id} id={item.id}>
                <AdhkarCard item={item} index={index} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}
