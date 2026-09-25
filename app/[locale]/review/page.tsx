import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { requireUser } from "@/lib/auth/require-user";
import { cn } from "@/lib/cn";
import { resolveMemorizationUnit } from "@/lib/memorization";
import { loadReviewDashboard } from "@/lib/review";
import type { ReviewScheduleItem } from "@/types/review";

function resolveDisplay(item: ReviewScheduleItem) {
  const resolved = resolveMemorizationUnit({
    unit_type: item.unitType,
    surah_number: item.surahNumber,
    start_ayah_number: item.startAyahNumber,
    end_ayah_number: item.endAyahNumber,
    page_number: item.pageNumber,
  });
  return resolved;
}

function unitLabel(
  item: ReviewScheduleItem,
  resolved: NonNullable<ReturnType<typeof resolveDisplay>>,
  t: Awaited<ReturnType<typeof getTranslations>>,
): string {
  if (resolved.unitType === "page" && resolved.pageNumber != null) {
    return t("unit.page", { page: resolved.pageNumber });
  }
  if (
    resolved.unitType === "range" &&
    resolved.startAyahNumber != null &&
    resolved.endAyahNumber != null
  ) {
    return t("unit.range", {
      name: resolved.primarySurahName,
      start: resolved.startAyahNumber,
      end: resolved.endAyahNumber,
    });
  }
  return t("unit.ayah", {
    name: resolved.primarySurahName,
    ayah: resolved.startAyahNumber ?? item.startAyahNumber,
  });
}

function ReviewList({
  title,
  empty,
  items,
  openInQuran,
  isArabic,
  t,
  showText = false,
}: {
  title: string;
  empty: string;
  items: ReviewScheduleItem[];
  openInQuran: string;
  isArabic: boolean;
  t: Awaited<ReturnType<typeof getTranslations>>;
  showText?: boolean;
}) {
  const resolved = items
    .map((item) => {
      const display = resolveDisplay(item);
      if (!display) {
        return null;
      }
      return { item, display };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <section className="space-y-3">
      <h2
        className={cn(
          "text-lg font-semibold text-emerald-deep",
          isArabic && "font-naskh",
        )}
      >
        {title}
      </h2>

      {resolved.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface/50 px-4 py-5 text-center text-sm text-muted">
          {empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {resolved.map(({ item, display }) => (
            <li
              key={item.reviewId}
              className="rounded-2xl border border-line bg-surface px-4 py-3.5 sm:px-5"
            >
              <p
                className={cn(
                  "text-sm font-medium text-emerald-deep",
                  isArabic && "font-naskh",
                )}
              >
                {unitLabel(item, display, t)}
              </p>
              {showText ? (
                <div
                  lang="ar"
                  dir="rtl"
                  className="mt-2 space-y-2 font-quran text-[1.25rem] leading-[2] text-ink"
                >
                  {display.ayahs.map((ayah) => (
                    <p key={`${ayah.surahNumber}:${ayah.ayahNumber}`}>
                      {ayah.text}
                    </p>
                  ))}
                </div>
              ) : null}
              <Link
                href={display.mushafHref}
                className="mt-2 inline-flex text-sm font-medium text-emerald transition-colors hover:text-emerald-deep"
              >
                {openInQuran}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function ReviewPage() {
  await requireUser("/review");

  const t = await getTranslations("Review");
  const isArabic = (await getLocale()) === "ar";
  const now = new Date();
  const { counts, overdue, dueToday, upcoming, recent } =
    await loadReviewDashboard(now);

  const hasDue = counts.dueNow > 0;
  const hasAny =
    counts.overdue + counts.dueToday + counts.upcoming + recent.length > 0;

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

        {!hasAny && counts.dueNow === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface/60 px-5 py-10 text-center">
            <p className="text-base text-ink">{t("emptyTitle")}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t("emptyDescription")}
            </p>
            <Link
              href="/memorization"
              className="mt-5 inline-flex rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-deep"
            >
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <section
              aria-label={t("stats.label")}
              className="grid grid-cols-3 gap-3"
            >
              <div className="rounded-2xl border border-line bg-surface px-3 py-3 text-center sm:px-4">
                <p className="text-2xl font-semibold text-ink">
                  {counts.overdue}
                </p>
                <p className="mt-1 text-xs text-muted">{t("stats.overdue")}</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface px-3 py-3 text-center sm:px-4">
                <p className="text-2xl font-semibold text-ink">
                  {counts.dueToday}
                </p>
                <p className="mt-1 text-xs text-muted">{t("stats.dueToday")}</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface px-3 py-3 text-center sm:px-4">
                <p className="text-2xl font-semibold text-ink">
                  {counts.upcoming}
                </p>
                <p className="mt-1 text-xs text-muted">{t("stats.upcoming")}</p>
              </div>
            </section>

            <div className="rounded-2xl border border-emerald/20 bg-sage/40 px-5 py-5 text-center sm:px-6">
              {hasDue ? (
                <>
                  <p className="text-sm text-muted">
                    {t("startHint", { count: counts.dueNow })}
                  </p>
                  <Link
                    href="/review/session"
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald px-6 text-sm font-semibold text-white shadow-card transition-colors hover:bg-emerald-deep"
                  >
                    {t("startReview")}
                  </Link>
                </>
              ) : (
                <>
                  <p className="font-medium text-ink">{t("caughtUpTitle")}</p>
                  <p className="mt-1 text-sm text-muted">
                    {t("caughtUpDescription")}
                  </p>
                </>
              )}
            </div>

            <ReviewList
              title={t("sections.overdueTitle")}
              empty={t("sections.overdueEmpty")}
              items={overdue}
              openInQuran={t("openInQuran")}
              isArabic={isArabic}
              t={t}
            />

            <ReviewList
              title={t("sections.dueTodayTitle")}
              empty={t("sections.dueTodayEmpty")}
              items={dueToday}
              openInQuran={t("openInQuran")}
              isArabic={isArabic}
              t={t}
            />

            <ReviewList
              title={t("sections.upcomingTitle")}
              empty={t("sections.upcomingEmpty")}
              items={upcoming}
              openInQuran={t("openInQuran")}
              isArabic={isArabic}
              t={t}
            />

            <ReviewList
              title={t("sections.recentTitle")}
              empty={t("sections.recentEmpty")}
              items={recent}
              openInQuran={t("openInQuran")}
              isArabic={isArabic}
              t={t}
              showText
            />
          </div>
        )}
      </Container>
    </main>
  );
}
