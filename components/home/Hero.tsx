import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { BookIcon, HeadphonesIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export async function Hero() {
  const t = await getTranslations("Home.hero");
  const isArabic = (await getLocale()) === "ar";

  return (
    <section className="relative isolate overflow-hidden bg-emerald-ink sm:rounded-b-[2.5rem]">
      {/* Supplied photograph. The mushaf sits on the left of the artwork, so the
          focal point is biased toward that side at every breakpoint. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[url(/images/hero.png)] bg-cover bg-no-repeat bg-[position:8%_60%] sm:bg-[position:14%_62%] lg:bg-[position:center_64%]"
      />

      {/* Readability layers: light veil overall, deeper only on the text side so
          the mushaf and window detail stay visible. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-emerald-ink/40 sm:bg-emerald-ink/28 lg:bg-emerald-ink/14"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-l from-emerald-ink/90 via-emerald-ink/55 to-transparent"
      />

      <Container className="relative">
        <div className="flex min-h-[14rem] items-center justify-end pt-9 pb-24 sm:pt-11 md:min-h-[16rem] md:pb-28 lg:min-h-[17.5rem] lg:pt-12 rtl:justify-start">
          <div className="flex w-full max-w-lg flex-col items-center text-center lg:max-w-[38rem]">
            <span
              className={cn(
                "inline-flex items-center gap-3 text-[0.8125rem] font-medium text-white/75",
                !isArabic && "tracking-[0.08em] uppercase",
              )}
            >
              <span aria-hidden className="h-px w-6 bg-white/25" />
              {t("eyebrow")}
              <span aria-hidden className="h-px w-6 bg-white/25" />
            </span>

            <h1
              className={cn(
                "mt-4 text-balance text-white drop-shadow-[0_1px_14px_rgb(10_30_22_/_0.6)]",
                isArabic
                  ? "font-naskh text-[2.25rem] leading-[1.45] sm:text-[2.75rem] lg:text-[3.25rem]"
                  : "font-display text-[2.125rem] leading-[1.18] sm:text-[2.75rem] lg:text-[3.375rem]",
              )}
            >
              {t.rich("title", {
                accent: (chunks) => (
                  <span className="text-gold-soft">{chunks}</span>
                ),
              })}
            </h1>

            <p
              className={cn(
                "mt-4 max-w-[26rem] text-[0.9375rem] text-white/75 sm:text-base",
                isArabic && "leading-[1.9]",
              )}
            >
              {t("description")}
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href="/quran"
                className={cn(
                  "inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-canvas px-7 font-semibold text-emerald-deep shadow-lift transition-colors hover:bg-white",
                  isArabic ? "text-[0.9375rem]" : "text-sm",
                )}
              >
                <BookIcon className="h-[1.125rem] w-[1.125rem]" />
                {t("primaryCta")}
              </Link>

              <Link
                href="/listen"
                className={cn(
                  "inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-white/30 px-7 font-medium text-white transition-colors hover:border-white/55 hover:bg-white/10",
                  isArabic ? "text-[0.9375rem]" : "text-sm",
                )}
              >
                <HeadphonesIcon className="h-[1.125rem] w-[1.125rem]" />
                {t("secondaryCta")}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
