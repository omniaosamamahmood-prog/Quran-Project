import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

export default async function OfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Offline");
  const isArabic = locale === "ar";

  return (
    <main id="main" className="py-16 sm:py-24">
      <Container className="max-w-[36rem]">
        <div className="rounded-3xl border border-line bg-surface px-6 py-10 text-center shadow-card sm:px-10">
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
          <p
            className={cn(
              "mt-4 text-sm leading-relaxed text-muted sm:text-base",
              isArabic && "leading-loose",
            )}
          >
            {t("description")}
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/quran"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-emerald-deep"
            >
              {t("openQuran")}
            </Link>
            <Link
              href="/adhkar"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald/20 bg-surface px-4 py-2.5 text-sm font-semibold text-emerald-deep transition-colors hover:bg-sage/70"
            >
              {t("openAdhkar")}
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
