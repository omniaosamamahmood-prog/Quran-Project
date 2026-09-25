import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BookVisual } from "@/components/home/BookVisual";
import { BookIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { getReadingProgress } from "@/lib/reading-progress";
import { getAyah } from "@/lib/quran";
import { createClient } from "@/lib/supabase/server";

export async function ContinueReading() {
  const t = await getTranslations("Home.continueReading");
  const isArabic = (await getLocale()) === "ar";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guests: never query private reading_progress; keep the normal Quran CTA.
  const progress = user ? await getReadingProgress() : null;
  const ayah =
    progress != null
      ? getAyah(progress.surah_number, progress.ayah_number)
      : undefined;

  const hasProgress = Boolean(progress && ayah);

  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-sage/70 to-surface shadow-card">
      {/* Faded mushaf artwork anchored to the far side */}
      <BookVisual
        className="pointer-events-none absolute bottom-0 end-0 hidden w-64 translate-y-6 text-emerald opacity-[0.16] sm:block lg:w-72"
      />

      <div className="relative p-5 sm:p-6 lg:p-7">
        <SectionHeading
          markAfter
          className={cn("justify-start", isArabic && "font-naskh")}
        >
          {t("title")}
        </SectionHeading>

        {hasProgress && progress && ayah ? (
          <div className="flex flex-col items-center px-2 py-7 text-center sm:py-9">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sage-deep bg-surface text-emerald">
              <BookIcon />
            </span>

            <p
              className={cn(
                "mt-4 font-semibold text-ink",
                isArabic ? "font-naskh text-[1.0625rem]" : "text-base",
              )}
            >
              {t("surahLabel", { name: ayah.surahName })}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t("positionMeta", {
                page: progress.page_number,
                ayah: progress.ayah_number,
              })}
            </p>

            <Link
              href={`/quran/page/${progress.page_number}#ayah-${progress.surah_number}-${progress.ayah_number}`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald px-6 text-sm font-medium text-white shadow-card transition-colors hover:bg-emerald-deep"
            >
              {t("resumeAction")}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center px-2 py-7 text-center sm:py-9">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sage-deep bg-surface text-emerald">
              <BookIcon />
            </span>

            <p
              className={cn(
                "mt-4 font-semibold text-ink",
                isArabic ? "text-[1.0625rem]" : "text-base",
              )}
            >
              {t("emptyTitle")}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
              {user ? t("emptyDescriptionSignedIn") : t("emptyDescription")}
            </p>

            <Link
              href="/quran"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald px-6 text-sm font-medium text-white shadow-card transition-colors hover:bg-emerald-deep"
            >
              {t("action")}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
