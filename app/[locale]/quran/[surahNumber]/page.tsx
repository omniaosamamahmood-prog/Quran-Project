import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SurahReader } from "@/components/quran/SurahReader";
import { getSurahByNumber, listSurahNumbers } from "@/lib/quran";

export function generateStaticParams() {
  return listSurahNumbers().map((surahNumber) => ({
    surahNumber: String(surahNumber),
  }));
}

export default async function SurahReaderPage({
  params,
}: {
  params: Promise<{ locale: string; surahNumber: string }>;
}) {
  const { locale, surahNumber } = await params;
  setRequestLocale(locale);
  const surah = getSurahByNumber(Number(surahNumber));

  if (!surah) {
    notFound();
  }

  return <SurahReader surah={surah} />;
}
