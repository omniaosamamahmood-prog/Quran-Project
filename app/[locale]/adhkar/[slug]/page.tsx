import { setRequestLocale } from "next-intl/server";
import { AdhkarCategoryView } from "@/components/adhkar/AdhkarCategoryView";
import { getAdhkarCategories } from "@/lib/adhkar";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return getAdhkarCategories().map((category) => ({
    slug: category.slug,
  }));
}

export default async function AdhkarCategoryPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <AdhkarCategoryView slug={slug} />;
}
