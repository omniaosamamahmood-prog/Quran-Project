import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  ReviewSession,
  type ReviewSessionCard,
} from "@/components/review/ReviewSession";
import { Container } from "@/components/ui/Container";
import { requireUser } from "@/lib/auth/require-user";
import { cn } from "@/lib/cn";
import { resolveMemorizationUnit } from "@/lib/memorization";
import { listDueReviews } from "@/lib/review";

export default async function ReviewSessionPage() {
  await requireUser("/review/session");

  const t = await getTranslations("Review");
  const isArabic = (await getLocale()) === "ar";
  const due = await listDueReviews();

  const items: ReviewSessionCard[] = due.flatMap((item) => {
    const resolved = resolveMemorizationUnit({
      unit_type: item.unitType,
      surah_number: item.surahNumber,
      start_ayah_number: item.startAyahNumber,
      end_ayah_number: item.endAyahNumber,
      page_number: item.pageNumber,
    });
    if (!resolved) {
      return [];
    }

    let title: string;
    let promptKey: "promptAyah" | "promptRange" | "promptPage";

    if (resolved.unitType === "page" && resolved.pageNumber != null) {
      title = t("unit.page", { page: resolved.pageNumber });
      promptKey = "promptPage";
    } else if (
      resolved.unitType === "range" &&
      resolved.startAyahNumber != null &&
      resolved.endAyahNumber != null
    ) {
      title = t("unit.range", {
        name: resolved.primarySurahName,
        start: resolved.startAyahNumber,
        end: resolved.endAyahNumber,
      });
      promptKey = "promptRange";
    } else {
      title = t("unit.ayah", {
        name: resolved.primarySurahName,
        ayah: resolved.startAyahNumber ?? item.startAyahNumber,
      });
      promptKey = "promptAyah";
    }

    return [
      {
        reviewId: item.reviewId,
        unitType: resolved.unitType,
        title,
        promptKey,
        ayahs: resolved.ayahs.map((a) => ({
          surahNumber: a.surahNumber,
          ayahNumber: a.ayahNumber,
          text: a.text,
          bismillah: a.bismillah,
        })),
        mushafHref: resolved.mushafHref,
      },
    ];
  });

  return (
    <main id="main" className="py-8 sm:py-12">
      <Container className="max-w-[40rem]">
        <header className="mb-6">
          <Link
            href="/review"
            className="text-sm font-medium text-muted transition-colors hover:text-emerald"
          >
            {t("session.backToDashboard")}
          </Link>
          <h1
            className={cn(
              "mt-3 text-emerald",
              isArabic
                ? "font-naskh text-[1.7rem] leading-[1.5]"
                : "font-display text-2xl tracking-tight sm:text-3xl",
            )}
          >
            {t("session.title")}
          </h1>
        </header>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface/60 px-5 py-10 text-center">
            <p className="text-base font-medium text-ink">
              {t("session.completeTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t("session.completeDescription")}
            </p>
            <Link
              href="/review"
              className="mt-5 inline-flex rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-deep"
            >
              {t("session.backToDashboard")}
            </Link>
          </div>
        ) : (
          <ReviewSession items={items} />
        )}
      </Container>
    </main>
  );
}
