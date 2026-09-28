import { AdhkarCategoryView } from "@/components/adhkar/AdhkarCategoryView";
import { getAdhkarCategories } from "@/lib/adhkar";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAdhkarCategories().map((category) => ({ slug: category.slug }));
}

export default async function AdhkarCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  return <AdhkarCategoryView slug={slug} />;
}
