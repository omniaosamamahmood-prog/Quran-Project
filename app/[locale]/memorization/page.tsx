import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MemorizationItemActions } from "@/components/memorization/MemorizationItemActions";
import { MemorizationPracticeAudio } from "@/components/memorization/MemorizationPracticeAudio";
import { Container } from "@/components/ui/Container";
import { requireUser } from "@/lib/auth/require-user";
import { cn } from "@/lib/cn";
import {
  listMemorizations,
  partitionMemorizations,
  resolveMemorizationUnit,
  summarizeMemorizations,
  type ResolvedMemorizationUnit,
} from "@/lib/memorization";
import type { MemorizationRow } from "@/types/memorization";

type MemorizationItem = {
  row: MemorizationRow;
  resolved: ResolvedMemorizationUnit;
};

function resolveItems(rows: MemorizationRow[]): MemorizationItem[] {
  return rows.flatMap((row) => {
    const resolved = resolveMemorizationUnit(row);
    if (!resolved) {
      return [];
    }
    return [{ row, resolved }];
  });
}

function unitLabel(
  resolved: ResolvedMemorizationUnit,
  t: Awaited<ReturnType<typeof getTranslations>>,
): string {
  if (resolved.unitType === "page" && resolved.pageNumber != null) {
    return t("unit.page", { page: resolved.pageNumber });
  }
  if (
    resolved.unitType === "range" &&
    resolved.surahNumber != null &&
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
    ayah: resolved.startAyahNumber ?? 0,
  });
}

function MemorizationSection({
  title,
  description,
  items,
  emptyLabel,
  openInQuran,
  statusLearning,
  statusMemorized,
  isArabic,
  t,
}: {
  title: string;
  description: string;
  items: MemorizationItem[];
  emptyLabel: string;
  openInQuran: string;
  statusLearning: string;
  statusMemorized: string;
  isArabic: boolean;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <section className="space-y-4">
      <header>
        <h2
          className={cn(
            "text-lg font-semibold text-emerald-deep",
            isArabic && "font-naskh",
          )}
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface/50 px-4 py-6 text-center text-sm text-muted">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map(({ row, resolved }) => {
            const statusLabel =
              row.status === "memorized" ? statusMemorized : statusLearning;

            return (
              <li
                key={row.id}
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
                      {unitLabel(resolved, t)}
                    </p>
                    {resolved.unitType === "page" &&
                    resolved.surahNames.length > 1 ? (
                      <p className="mt-1 text-xs text-muted">
                        {t("unit.pageSurahs", {
                          names: resolved.surahNames.join(" · "),
                        })}
                      </p>
                    ) : null}
                    <p className="mt-1 inline-flex rounded-lg bg-sage/70 px-2 py-0.5 text-xs font-medium text-emerald-deep">
                      {statusLabel}
                    </p>
                  </div>
                  <MemorizationItemActions
                    memorizationId={row.id}
                    status={row.status}
                  />
                </div>

                <MemorizationPracticeAudio
                  ayahs={resolved.ayahs.map((ayah) => ({
                    surahNumber: ayah.surahNumber,
                    ayahNumber: ayah.ayahNumber,
                    text: ayah.text,
                    bismillah: ayah.bismillah,
                  }))}
                />

                <Link
                  href={resolved.mushafHref}
                  className="mt-4 inline-flex text-sm font-medium text-emerald transition-colors hover:text-emerald-deep"
                >
                  {openInQuran}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default async function MemorizationPage() {
  await requireUser("/memorization");

  const t = await getTranslations("Memorization");
  const isArabic = (await getLocale()) === "ar";
  const rows = await listMemorizations();
  const summary = summarizeMemorizations(rows);
  const { learning, memorized } = partitionMemorizations(rows);
  const learningItems = resolveItems(learning);
  const memorizedItems = resolveItems(memorized);

  return (
    <main id="main" className="py-8 sm:py-12">
      <Container className="max-w-[42rem]">
        <header className="mb-8 border-b border-line pb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
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
            </div>

            <Link
              href="/review"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald/20 bg-surface px-3.5 py-2 text-sm font-semibold text-emerald-deep transition-colors hover:bg-sage/70"
            >
              {t("goToReview")}
            </Link>
          </div>
        </header>

        {summary.total === 0 ? (
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
          <div className="space-y-8">
            <section
              aria-label={t("stats.label")}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-center">
                <p className="text-2xl font-semibold text-ink">{summary.total}</p>
                <p className="mt-1 text-xs text-muted">{t("stats.total")}</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-center">
                <p className="text-2xl font-semibold text-ink">
                  {summary.learning}
                </p>
                <p className="mt-1 text-xs text-muted">{t("stats.learning")}</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-center">
                <p className="text-2xl font-semibold text-ink">
                  {summary.memorized}
                </p>
                <p className="mt-1 text-xs text-muted">{t("stats.memorized")}</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-center">
                <p className="text-2xl font-semibold text-ink">
                  {summary.completionPercent}%
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t("stats.completion")}
                </p>
              </div>
            </section>

            <MemorizationSection
              title={t("sections.learningTitle")}
              description={t("sections.learningDescription")}
              items={learningItems}
              emptyLabel={t("sections.learningEmpty")}
              openInQuran={t("openInQuran")}
              statusLearning={t("status.learning")}
              statusMemorized={t("status.memorized")}
              isArabic={isArabic}
              t={t}
            />

            <MemorizationSection
              title={t("sections.memorizedTitle")}
              description={t("sections.memorizedDescription")}
              items={memorizedItems}
              emptyLabel={t("sections.memorizedEmpty")}
              openInQuran={t("openInQuran")}
              statusLearning={t("status.learning")}
              statusMemorized={t("status.memorized")}
              isArabic={isArabic}
              t={t}
            />
          </div>
        )}
      </Container>
    </main>
  );
}
