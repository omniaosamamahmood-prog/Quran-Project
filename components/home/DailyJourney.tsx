import { getLocale, getTranslations } from "next-intl/server";
import { ShortcutCard } from "@/components/home/ShortcutCard";
import { ChartIcon } from "@/components/ui/icons";

export async function DailyJourney() {
  const t = await getTranslations("Home.dailyJourney");
  const isArabic = (await getLocale()) === "ar";

  return (
    <ShortcutCard
      href="/quran"
      title={t("title")}
      description={t("description")}
      icon={ChartIcon}
      isArabic={isArabic}
    />
  );
}
