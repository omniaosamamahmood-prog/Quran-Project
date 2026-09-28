import { getLocale, getTranslations } from "next-intl/server";
import { ListenPageClient } from "@/components/audio/ListenPageClient";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { getSurahSummaries } from "@/lib/quran";

export default async function ListenPage() {
  const t = await getTranslations("Audio");
  const isArabic = (await getLocale()) === "ar";
  const surahs = getSurahSummaries().map((surah) => ({
    number: surah.number,
    name: surah.name,
    ayahCount: surah.ayahCount,
  }));

  return (
    <main id="main" className="py-8 sm:py-12">
      <Container className="max-w-[42rem]">
        <header className="mb-8 border-b border-line pb-6">
          <h1
            className={cn(
              "text-emerald",
              isArabic
                ? "font-naskh text-[1.9rem] leading-[1.5]"
                : "font-display text-3xl tracking-tight",
            )}
          >
            {t("pageTitle")}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            {t("pageSubtitle")}
          </p>
        </header>

        <ListenPageClient surahs={surahs} />
      </Container>
    </main>
  );
}
