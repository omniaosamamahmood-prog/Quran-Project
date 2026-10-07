import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FavoriteKeysProvider } from "@/components/favorites/FavoriteKeysProvider";
import { FavoriteToggle } from "@/components/favorites/FavoriteToggle";
import { Container } from "@/components/ui/Container";
import { ArrowIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { Surah } from "@/types/quran";

type SurahReaderProps = {
  surah: Surah;
};

export async function SurahReader({ surah }: SurahReaderProps) {
  const t = await getTranslations("Quran");
  const isArabic = (await getLocale()) === "ar";
  const ayahCount = surah.ayahs.length;
  const bismillah = surah.ayahs[0]?.bismillah;

  return (
    <main id="main" className="py-8 sm:py-12">
      <Container className="max-w-[46rem]">
        <nav className="mb-8">
          <Link
            href="/quran"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-emerald"
          >
            <ArrowIcon className="rotate-180 rtl:rotate-0" />
            {t("reader.backToList")}
          </Link>
        </nav>

        <FavoriteKeysProvider>
        <article>
          <header className="border-b border-line pb-7 text-center">
            <p
              className={cn(
                "text-[0.8125rem] text-muted",
                isArabic && "leading-relaxed",
              )}
            >
              {t("reader.surahNumber", { number: surah.number })}
            </p>

            <h1
              lang="ar"
              dir="rtl"
              className="mt-2 font-naskh text-[2rem] leading-[1.5] text-emerald sm:text-[2.375rem]"
            >
              {surah.name}
            </h1>

            <p
              className={cn(
                "mt-2 text-[0.8125rem] text-muted",
                isArabic && "leading-relaxed",
              )}
            >
              {ayahCount} {t("ayahUnit", { count: ayahCount })}
            </p>
          </header>

          <div
            lang="ar"
            dir="rtl"
            className="pt-8 font-quran text-[1.625rem] leading-[2.55] text-ink sm:text-[1.85rem] sm:leading-[2.7]"
          >
            {bismillah ? (
              <p className="mb-8 text-center text-emerald-deep">{bismillah}</p>
            ) : null}

            <p>
              {surah.ayahs.map((ayah) => (
                <span key={ayah.number} id={`ayah-${ayah.number}`}>
                  {ayah.text}
                  <span
                    aria-label={t("reader.ayahMarker", { number: ayah.number })}
                    className="mx-[0.32em] inline-flex h-[1.5em] w-[1.5em] -translate-y-[0.08em] items-center justify-center rounded-full border border-gold/50 align-middle text-[0.58em] font-semibold leading-none text-emerald"
                  >
                    {ayah.number}
                  </span>
                  <FavoriteToggle
                    surahNumber={surah.number}
                    ayahNumber={ayah.number}
                    returnPath={`/quran/${surah.number}#ayah-${ayah.number}`}
                    className="mx-[0.08em] inline-flex -translate-y-[0.14em] align-middle"
                  />
                </span>
              ))}
            </p>
          </div>
        </article>
        </FavoriteKeysProvider>
      </Container>
    </main>
  );
}
