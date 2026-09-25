import { notFound } from "next/navigation";
import { SurahReader } from "@/components/quran/SurahReader";
import { getSurahByNumber } from "@/lib/quran";

export default async function SurahReaderPage({
  params,
}: {
  params: Promise<{ locale: string; surahNumber: string }>;
}) {
  const { surahNumber } = await params;
  const surah = getSurahByNumber(Number(surahNumber));

  if (!surah) {
    notFound();
  }

  return <SurahReader surah={surah} />;
}
