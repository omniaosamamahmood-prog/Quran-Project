import { getLocale, getTranslations } from "next-intl/server";
import { GraduationCapIcon } from "@/components/ui/icons";
import { HomePanel } from "@/components/home/HomePanel";
import { cn } from "@/lib/cn";
import { loadMemorizationRows, summarizeMemorizations } from "@/lib/memorization";
import type { MemorizationRow, MemorizationStatus, MemorizationUnitType } from "@/types/memorization";

type MemorizationProgressProps = {
  isAuthenticated: boolean;
};

function countByType(
  rows: MemorizationRow[],
  status: MemorizationStatus,
): Record<MemorizationUnitType, number> {
  const counts: Record<MemorizationUnitType, number> = {
    ayah: 0,
    range: 0,
    page: 0,
  };

  for (const row of rows) {
    if (row.status === status) {
      counts[row.unit_type] += 1;
    }
  }

  return counts;
}

export async function MemorizationProgress({
  isAuthenticated,
}: MemorizationProgressProps) {
  const t = await getTranslations("Home.memorizationProgress");
  const isArabic = (await getLocale()) === "ar";

  let rows: MemorizationRow[] | null = null;
  let failed = false;

  if (isAuthenticated) {
    try {
      const result = await loadMemorizationRows();
      if (result.ok) {
        rows = result.rows;
      } else {
        failed = true;
      }
    } catch {
      failed = true;
    }
  }

  const summary = rows ? summarizeMemorizations(rows) : null;
  const hasUnits = Boolean(summary && summary.total > 0);

  function formatCounts(status: MemorizationStatus): string {
    if (!rows) {
      return t("none");
    }

    const counts = countByType(rows, status);
    const parts = [
      counts.ayah > 0 ? t("ayahCount", { count: counts.ayah }) : null,
      counts.range > 0 ? t("rangeCount", { count: counts.range }) : null,
      counts.page > 0 ? t("pageCount", { count: counts.page }) : null,
    ].filter((part): part is string => part != null);

    return parts.length > 0 ? parts.join(" · ") : t("none");
  }

  return (
    <HomePanel
      href="/memorization"
      action={t("cta")}
      icon={
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage text-emerald">
          <GraduationCapIcon className="h-5 w-5" />
        </span>
      }
      title={
        <h2
          className={cn(
            "font-semibold text-ink",
            isArabic ? "font-naskh text-[1.0625rem]" : "text-[0.9375rem]",
          )}
        >
          {t("title")}
        </h2>
      }
    >
      {failed ? (
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {t("errorDescription")}
        </p>
      ) : hasUnits ? (
        <dl className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-sage px-3 py-2">
            <dt className="text-xs text-muted">{t("memorizedLabel")}</dt>
            <dd className="mt-0.5 text-sm font-medium leading-snug text-ink">
              {formatCounts("memorized")}
            </dd>
          </div>
          <div className="rounded-xl bg-sage px-3 py-2">
            <dt className="text-xs text-muted">{t("learningLabel")}</dt>
            <dd className="mt-0.5 text-sm font-medium leading-snug text-ink">
              {formatCounts("learning")}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {isAuthenticated ? t("emptyDescription") : t("guestDescription")}
        </p>
      )}
    </HomePanel>
  );
}
