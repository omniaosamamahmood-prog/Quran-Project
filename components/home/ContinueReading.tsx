import { getLocale, getTranslations } from "next-intl/server";
import { BookIcon } from "@/components/ui/icons";
import { HomePanel } from "@/components/home/HomePanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { getAyah, getMushafPageCount, getSurahSummaries } from "@/lib/quran";
import { getReadingProgress, type ReadingProgressResult } from "@/lib/reading-progress";

type ContinueReadingProps = {
  isAuthenticated: boolean;
};

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-sage px-3 py-2.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold leading-snug text-ink">{value}</p>
    </div>
  );
}

export async function ContinueReading({ isAuthenticated }: ContinueReadingProps) {
  const t = await getTranslations("Home.continueReading");
  const isArabic = (await getLocale()) === "ar";

  let reading: ReadingProgressResult = { status: "empty" };
  if (isAuthenticated) {
    try {
      reading = await getReadingProgress();
    } catch {
      reading = { status: "error" };
    }
  }

  const ayah =
    reading.status === "ready"
      ? getAyah(reading.progress.surah_number, reading.progress.ayah_number)
      : undefined;
  const hasProgress = reading.status === "ready" && Boolean(ayah);
  const opening = getAyah(1, 1);

  const href =
    hasProgress && reading.status === "ready"
      ? `/quran/page/${reading.progress.page_number}#ayah-${reading.progress.surah_number}-${reading.progress.ayah_number}`
      : "/quran";

  let detail = isAuthenticated
    ? t("emptyDescriptionSignedIn")
    : t("emptyDescription");
  if (reading.status === "error") {
    detail = t("errorDescription");
  }

  return (
    <HomePanel
      href={href}
      action={hasProgress ? t("resumeAction") : t("action")}
      icon={
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage text-emerald">
          <BookIcon className="h-5 w-5" />
        </span>
      }
      title={
        <SectionHeading
          markAfter
          className={cn("justify-start", isArabic && "font-naskh")}
        >
          {t("title")}
        </SectionHeading>
      }
    >
      {reading.status === "error" ? (
        <p className="text-sm leading-relaxed text-muted">{detail}</p>
      ) : null}

      {hasProgress && reading.status === "ready" && ayah ? (
        <div className="grid grid-cols-3 gap-2">
          <Fact label={t("factSurah")} value={ayah.surahName} />
          <Fact label={t("factPage")} value={reading.progress.page_number} />
          <Fact label={t("factAyah")} value={reading.progress.ayah_number} />
        </div>
      ) : reading.status === "error" ? null : (
        <>
          <p className="text-sm leading-relaxed text-muted">{detail}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Fact label={t("factSurahs")} value={getSurahSummaries().length} />
            <Fact label={t("factPages")} value={getMushafPageCount()} />
            <Fact
              label={t("factStart")}
              value={opening?.surahName ?? ""}
            />
          </div>
        </>
      )}
    </HomePanel>
  );
}
