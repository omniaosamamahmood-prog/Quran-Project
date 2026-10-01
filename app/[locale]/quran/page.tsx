import { getLocale, getTranslations } from "next-intl/server";
import { QuranCatalog } from "@/components/quran/QuranCatalog";
import { Container } from "@/components/ui/Container";
import { getJuzSummaries, getSurahSummaries } from "@/lib/quran";
import { cn } from "@/lib/cn";

export default async function QuranPage() {
  const t = await getTranslations("Quran");
  const isArabic = (await getLocale()) === "ar";

  // Read server-side. Only summaries cross to the client — never ayah text.
  const surahs = getSurahSummaries();
  const juzs = getJuzSummaries();

  return (
    <main id="main" className="py-10 sm:py-14">
      <Container>
        <header>
          <h1
            className={cn(
              "text-emerald",
              isArabic
                ? "font-naskh text-[1.9rem] leading-[1.5]"
                : "font-display text-3xl",
            )}
          >
            {t("title")}
          </h1>
        </header>

        <QuranCatalog surahs={surahs} juzs={juzs} />
      </Container>
    </main>
  );
}
