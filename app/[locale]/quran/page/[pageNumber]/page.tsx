import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { MushafPageReader } from "@/components/quran/MushafPageReader";
import { getMushafPageCount, getQuranPage } from "@/lib/quran";

export function generateStaticParams() {
  return Array.from({ length: getMushafPageCount() }, (_, index) => ({
    pageNumber: String(index + 1),
  }));
}

export default async function MushafPageRoute({
  params,
}: {
  params: Promise<{ locale: string; pageNumber: string }>;
}) {
  const { locale, pageNumber } = await params;
  setRequestLocale(locale);
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
