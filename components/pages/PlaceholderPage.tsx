import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

type PlaceholderPageProps = {
  namespace: "quran" | "memorization" | "favorites" | "adhkar";
};

export async function PlaceholderPage({ namespace }: PlaceholderPageProps) {
  const t = await getTranslations(`Pages.${namespace}`);
  const isArabic = (await getLocale()) === "ar";

  return (
    <main id="main" className="py-10 sm:py-14">
      <Container>
        <h1
          className={cn(
            "text-emerald",
            isArabic
              ? "font-naskh text-[1.9rem] leading-[1.5]"
              : "font-display text-3xl",
          )}
        >
          {t("title")}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
          {t("description")}
        </p>
      </Container>
    </main>
  );
}
