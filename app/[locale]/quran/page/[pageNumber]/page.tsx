import { notFound } from "next/navigation";
import { MushafPageReader } from "@/components/quran/MushafPageReader";
import { getQuranPage } from "@/lib/quran";

export default async function MushafPageRoute({
  params,
}: {
  params: Promise<{ locale: string; pageNumber: string }>;
}) {
  const { pageNumber } = await params;
  const parsed = Number(pageNumber);

  if (!Number.isInteger(parsed)) {
    notFound();
  }

  const page = getQuranPage(parsed);

  if (!page) {
    notFound();
  }

  return <MushafPageReader page={page} />;
}
