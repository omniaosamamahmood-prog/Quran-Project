import { getLocale, getTranslations } from "next-intl/server";
import { SurahList } from "@/components/quran/SurahList";
import { Container } from "@/components/ui/Container";
import { getSurahSummaries } from "@/lib/quran";
import { cn } from "@/lib/cn";

export default async function QuranPage() {
  const t = await getTranslations("Quran");
  const isArabic = (await getLocale()) === "ar";

  // Read server-side; only number/name/ayahCount/firstPage crosses to the client.
  const surahs = getSurahSummaries();

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

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="text-sm text-muted sm:text-base">{t("subtitle")}</p>
            <span className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 text-[0.75rem] text-muted">
              {surahs.length} {t("surahUnit", { count: surahs.length })}
            </span>
          </div>
        </header>

        <SurahList surahs={surahs} />
      </Container>
    </main>
  );
}
