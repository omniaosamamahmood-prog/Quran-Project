import { AdhkarCategoryView } from "@/components/adhkar/AdhkarCategoryView";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// The locale layout reads the Supabase session via cookies(), so this page
// cannot be statically generated. Doing so crashes the live deployment.
export const dynamic = "force-dynamic";

export default async function AdhkarCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  return <AdhkarCategoryView slug={slug} />;
}
