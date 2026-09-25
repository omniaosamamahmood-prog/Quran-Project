import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RemoveFavoriteButton } from "@/components/favorites/RemoveFavoriteButton";
import { Container } from "@/components/ui/Container";
import { requireUser } from "@/lib/auth/require-user";
import { cn } from "@/lib/cn";
import { listFavorites } from "@/lib/favorites";
import { getAyah, getPageForAyah } from "@/lib/quran";

export default async function FavoritesPage() {
  await requireUser("/favorites");

  const t = await getTranslations("Favorites");
  const isArabic = (await getLocale()) === "ar";
  const rows = await listFavorites();

  const items = rows.flatMap((row) => {
    const ayah = getAyah(row.surah_number, row.ayah_number);
    if (!ayah) {
      return [];
    }

    const pageNumber = getPageForAyah(row.surah_number, row.ayah_number);

    return [
      {
        id: row.id,
        surahNumber: row.surah_number,
        ayahNumber: row.ayah_number,
        surahName: ayah.surahName,
        text: ayah.text,
        pageNumber,
      },
    ];
  });

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
            {t("title")}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            {t("subtitle")}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface/60 px-5 py-10 text-center">
            <p className="text-base text-ink">{t("emptyTitle")}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t("emptyDescription")}
            </p>
            <Link
              href="/quran"
              className="mt-5 inline-flex rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-deep"
            >
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => {
              const href = item.pageNumber
                ? `/quran/page/${item.pageNumber}#ayah-${item.surahNumber}-${item.ayahNumber}`
                : `/quran/${item.surahNumber}#ayah-${item.ayahNumber}`;

              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-line bg-surface px-4 py-4 sm:px-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium text-emerald-deep",
                          isArabic && "font-naskh",
                        )}
                      >
                        {t("itemMeta", {
                          surahName: item.surahName,
                          surahNumber: item.surahNumber,
                          ayahNumber: item.ayahNumber,
                        })}
                      </p>
                    </div>
                    <RemoveFavoriteButton
                      surahNumber={item.surahNumber}
                      ayahNumber={item.ayahNumber}
                    />
                  </div>

                  <p
                    lang="ar"
                    dir="rtl"
                    className="mt-3 font-quran text-[1.35rem] leading-[2.1] text-ink sm:text-[1.5rem] sm:leading-[2.2]"
                  >
                    {item.text}
                  </p>

                  <Link
                    href={href}
                    className="mt-4 inline-flex text-sm font-medium text-emerald transition-colors hover:text-emerald-deep"
                  >
                    {t("openInQuran")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </main>
  );
}
