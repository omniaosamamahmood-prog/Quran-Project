import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MushafInteractiveLeaf } from "@/components/favorites/MushafInteractiveLeaf";
import { ArrowIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { getFavoriteKeySet } from "@/lib/favorites";
import {
  getMemorizationKeySet,
  getMemorizationUnitIdentitySet,
} from "@/lib/memorization";
import { getMushafPageCount } from "@/lib/quran";
import { createClient } from "@/lib/supabase/server";
import type { QuranPage, QuranPageAyah } from "@/types/quran";

type MushafPageReaderProps = {
  page: QuranPage;
};

type SurahSegment = {
  surahNumber: number;
  surahName: string;
  ayahs: QuranPageAyah[];
};

function groupAyahsBySurah(ayahs: QuranPageAyah[]): SurahSegment[] {
  const segments: SurahSegment[] = [];

  for (const ayah of ayahs) {
    const current = segments[segments.length - 1];

    if (!current || current.surahNumber !== ayah.surahNumber) {
      segments.push({
        surahNumber: ayah.surahNumber,
        surahName: ayah.surahName,
        ayahs: [ayah],
      });
      continue;
    }

    current.ayahs.push(ayah);
  }

  return segments;
}

/** Presentation-only digit shaping for the printed page number. */
function toEasternDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]!);
}

export async function MushafPageReader({ page }: MushafPageReaderProps) {
  const t = await getTranslations("Quran");
  const isArabic = (await getLocale()) === "ar";
  const totalPages = getMushafPageCount();
  const segments = groupAyahsBySurah(page.ayahs);
  const hasPrevious = page.pageNumber > 1;
  const hasNext = page.pageNumber < totalPages;
  /** Subtle compact only for unusually dense pages — never enlarges short ones. */
  const pageCharCount = page.ayahs.reduce(
    (sum, ayah) => sum + ayah.text.length,
    0,
  );
  const isCompact = pageCharCount > 1450;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);
  const favoriteKeys = isAuthenticated
    ? [...(await getFavoriteKeySet())]
    : [];
  const memorizationKeys = isAuthenticated
    ? [...(await getMemorizationKeySet())]
    : [];
  const memorizationUnitIds = isAuthenticated
    ? [...(await getMemorizationUnitIdentitySet())]
    : [];

  const prevControl = hasPrevious ? (
    <Link
      href={`/quran/page/${page.pageNumber - 1}`}
      className="inline-flex items-center gap-2 text-sm text-emerald transition-colors hover:text-emerald-deep"
    >
      <ArrowIcon className="rotate-180 rtl:rotate-0" />
      <span className="max-lg:sr-only">{t("pageReader.previous")}</span>
    </Link>
  ) : (
    <span className="inline-flex items-center gap-2 text-sm text-muted/50">
      <ArrowIcon className="rotate-180 rtl:rotate-0" />
      <span className="max-lg:sr-only">{t("pageReader.previous")}</span>
    </span>
  );

  const nextControl = hasNext ? (
    <Link
      href={`/quran/page/${page.pageNumber + 1}`}
      className="inline-flex items-center gap-2 text-sm text-emerald transition-colors hover:text-emerald-deep"
    >
      <span className="max-lg:sr-only">{t("pageReader.next")}</span>
      <ArrowIcon className="rtl:rotate-180" />
    </Link>
  ) : (
    <span className="inline-flex items-center gap-2 text-sm text-muted/50">
      <span className="max-lg:sr-only">{t("pageReader.next")}</span>
      <ArrowIcon className="rtl:rotate-180" />
    </span>
  );

  return (
    <main id="main" className="mushaf-reader">
      <div className="mushaf-reader-inner">
        <nav className="mushaf-reader-back">
          <Link
            href="/quran"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-emerald"
          >
            <ArrowIcon className="rotate-180 rtl:rotate-0" />
            {t("reader.backToList")}
          </Link>
        </nav>

        <h1 className="sr-only">
          {t("pageReader.indicator", {
            current: page.pageNumber,
            total: totalPages,
          })}
        </h1>

        <div className="mushaf-reader-stage">
          <div className="mushaf-reader-side mushaf-reader-side-prev">
            {prevControl}
          </div>

          <div className="mushaf-reader-page-column">
            <MushafInteractiveLeaf
              segments={segments}
              isCompact={isCompact}
              pageNumber={page.pageNumber}
              pageNumberLabel={toEasternDigits(page.pageNumber)}
              initialFavoriteKeys={favoriteKeys}
              initialMemorizationKeys={memorizationKeys}
              initialMemorizationUnitIds={memorizationUnitIds}
              isAuthenticated={isAuthenticated}
              returnPath={`/quran/page/${page.pageNumber}`}
            />
          </div>

          <div className="mushaf-reader-side mushaf-reader-side-next">
            {nextControl}
          </div>
        </div>

        <p
          className={cn(
            "mushaf-reader-indicator text-center text-sm text-muted",
            isArabic && "leading-relaxed",
          )}
        >
          {t("pageReader.indicator", {
            current: page.pageNumber,
            total: totalPages,
          })}
        </p>

        <nav
          aria-label={t("pageReader.navigation")}
          className="mushaf-reader-nav-mobile"
        >
          {prevControl}
          {nextControl}
        </nav>
      </div>

      <style href="mushaf-reader-layout" precedence="mushaf-reader">{`
        .mushaf-reader {
          --navbar-h: 4.25rem;
          --reader-chrome-h: 6.5rem;
          --mobile-nav-h: 0px;
          --mushaf-available-h: calc(
            100dvh - var(--navbar-h) - var(--reader-chrome-h) - var(--mobile-nav-h)
          );
          box-sizing: border-box;
          padding-block: 0.45rem 0.55rem;
        }
        @media (max-width: 639px) {
          .mushaf-reader {
            --mobile-nav-h: 3.75rem;
            --reader-chrome-h: 7.25rem;
          }
        }
        .mushaf-reader-inner {
          width: min(100%, 90rem);
          margin-inline: auto;
          padding-inline: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        @media (min-width: 640px) {
          .mushaf-reader-inner {
            padding-inline: 1.25rem;
          }
        }

        .mushaf-reader-back { flex-shrink: 0; }

        .mushaf-reader-stage {
          display: grid;
          grid-template-columns: 1fr;
          align-items: center;
          justify-items: center;
          --mushaf-available-h: calc(
            100dvh - var(--navbar-h) - var(--reader-chrome-h) - var(--mobile-nav-h)
          );
        }
        @media (min-width: 900px) {
          .mushaf-reader-stage {
            grid-template-columns: 5.5rem minmax(0, 1fr) 5.5rem;
            column-gap: 0.75rem;
          }
        }

        .mushaf-reader-page-column {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
          max-width: 100%;
        }

        .mushaf-reader-page {
          width: 100%;
          display: flex;
          justify-content: center;
          min-width: 0;
          max-width: 100%;
        }

        .mushaf-reader-side {
          display: none;
        }
        @media (min-width: 900px) {
          .mushaf-reader-side {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        .mushaf-reader-indicator {
          flex-shrink: 0;
          margin: 0;
          font-size: 0.8125rem;
        }

        .mushaf-reader-nav-mobile {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-shrink: 0;
        }
        @media (min-width: 900px) {
          .mushaf-reader-nav-mobile { display: none; }
        }

        .mushaf-quran {
          flex: 0 1 auto;
          color: #1a1510;
          font-size: 1.375rem;
          line-height: 1.9;
        }
        @media (min-width: 640px) {
          .mushaf-quran {
            font-size: 1.625rem;
            line-height: 1.9;
          }
        }
        @media (min-width: 1024px) {
          .mushaf-quran {
            font-size: 1.8125rem;
            line-height: 1.92;
          }
        }
        @media (min-width: 1024px) and (max-height: 820px) {
          .mushaf-quran {
            font-size: 1.625rem;
            line-height: 1.85;
          }
        }
        @media (min-width: 1024px) and (max-height: 700px) {
          .mushaf-quran {
            font-size: 1.5rem;
            line-height: 1.8;
          }
        }
        .mushaf-quran--compact {
          font-size: 1.25rem;
          line-height: 1.85;
        }
        @media (min-width: 640px) {
          .mushaf-quran--compact {
            font-size: 1.5rem;
            line-height: 1.85;
          }
        }
        @media (min-width: 1024px) {
          .mushaf-quran--compact {
            font-size: 1.6875rem;
            line-height: 1.88;
          }
        }

        .mushaf-surah-block + .mushaf-surah-block {
          margin-top: 0.55em;
        }
        .mushaf-surah-title {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin: 0 0 0.4em;
        }
        .mushaf-surah-rule {
          flex: 1 1 auto;
          min-width: 0.5rem;
          height: 1px;
          background: linear-gradient(
            to left,
            rgba(15, 122, 82, 0.35),
            rgba(201, 162, 39, 0.35),
            transparent
          );
        }
        .mushaf-surah-rule:last-child {
          background: linear-gradient(
            to right,
            rgba(15, 122, 82, 0.35),
            rgba(201, 162, 39, 0.35),
            transparent
          );
        }
        .mushaf-surah-name {
          flex-shrink: 0;
          border: 1px solid rgba(15, 122, 82, 0.3);
          box-shadow: inset 0 0 0 1px rgba(201, 162, 39, 0.28);
          background: #faf6eb;
          padding: 0.2em 0.55em;
          font-family: var(--font-arabic-display), var(--font-naskh), serif;
          font-size: 0.55em;
          line-height: 1;
          color: #235c48;
        }
        .mushaf-basmala {
          margin: 0 0 0.4em;
          text-align: center;
          font-size: 1.02em;
          line-height: 1.7;
          color: #1a1510;
        }
        .mushaf-ayah-flow {
          margin: 0;
        }

        .mushaf-page-num {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          flex: 0 0 auto;
          margin-top: 0.35rem;
          padding-top: 0.35rem;
          min-height: 1.75rem;
        }
        .mushaf-page-num-rule {
          display: block;
          width: 1.75rem;
          height: 1px;
          background: linear-gradient(
            to left,
            rgba(201, 162, 39, 0.55),
            transparent
          );
        }
        .mushaf-page-num-rule:last-child {
          background: linear-gradient(
            to right,
            rgba(201, 162, 39, 0.55),
            transparent
          );
        }
        .mushaf-page-num-diamond {
          display: block;
          width: 4px;
          height: 4px;
          transform: rotate(45deg);
          border: 1px solid rgba(201, 162, 39, 0.7);
          background: #faf6eb;
          flex-shrink: 0;
        }
        .mushaf-page-num-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.5rem;
          padding: 0.12rem 0.45rem;
          border: 1px solid rgba(15, 122, 82, 0.35);
          box-shadow: inset 0 0 0 1px rgba(201, 162, 39, 0.28);
          background: #faf6eb;
          font-family: var(--font-arabic-display), var(--font-naskh), serif;
          font-size: 0.75rem;
          line-height: 1;
          color: #0b4a34;
        }
      `}</style>
    </main>
  );
}
