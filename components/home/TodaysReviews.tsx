import { getLocale, getTranslations } from "next-intl/server";
import { ReviewIcon } from "@/components/ui/icons";
import { HomePanel } from "@/components/home/HomePanel";
import { cn } from "@/lib/cn";
import { getDueReviewSnapshot } from "@/lib/review";

type TodaysReviewsProps = {
  isAuthenticated: boolean;
};

export async function TodaysReviews({ isAuthenticated }: TodaysReviewsProps) {
  const t = await getTranslations("Home.todaysReviews");
  const isArabic = (await getLocale()) === "ar";

  let snapshot: Awaited<ReturnType<typeof getDueReviewSnapshot>> | null = null;
  if (isAuthenticated) {
    try {
      snapshot = await getDueReviewSnapshot({ skipEnsure: true });
    } catch {
      snapshot = { ok: false };
    }
  }

  const failed = snapshot != null && !snapshot.ok;
  const dueNow = snapshot?.ok ? snapshot.dueNow : 0;
  const scheduled = snapshot?.ok ? snapshot.scheduled : 0;
  const href = dueNow > 0 ? "/review/session" : "/review";

  let headline = t("guestTitle");
  let description = t("guestDescription");
  let action = t("guestCta");

  if (failed) {
    headline = t("errorTitle");
    description = t("errorDescription");
    action = t("openCta");
  } else if (isAuthenticated && dueNow > 0) {
    headline = t("due", { count: dueNow });
    description = t("dueDescription");
    action = t("startCta");
  } else if (isAuthenticated && scheduled > 0) {
    headline = t("caughtUpTitle");
    description = t("caughtUpDescription");
    action = t("openCta");
  } else if (isAuthenticated) {
    headline = t("emptyTitle");
    description = t("emptyDescription");
    action = t("openCta");
  }

  return (
    <HomePanel
      href={href}
      action={action}
      icon={
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage text-emerald">
          <ReviewIcon className="h-5 w-5" />
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
      <p
        className={cn(
          "mt-1.5 font-medium text-ink",
          isArabic ? "text-[0.9375rem]" : "text-sm",
        )}
      >
        {headline}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
    </HomePanel>
  );
}
