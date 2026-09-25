import { getLocale, getTranslations } from "next-intl/server";
import { ShortcutCard } from "@/components/home/ShortcutCard";
import { GraduationCapIcon } from "@/components/ui/icons";

export async function MemorizationShortcut() {
  const t = await getTranslations("Home.memorizationProgress");
  const isArabic = (await getLocale()) === "ar";

  return (
    <ShortcutCard
      href="/memorization"
      title={t("title")}
      description={t("description")}
      icon={GraduationCapIcon}
      tone="sage"
      isArabic={isArabic}
    />
  );
}
