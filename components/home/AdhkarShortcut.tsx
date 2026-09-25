import { getLocale, getTranslations } from "next-intl/server";
import { ShortcutCard } from "@/components/home/ShortcutCard";
import { LeafIcon } from "@/components/ui/icons";

export async function AdhkarShortcut() {
  const t = await getTranslations("Home.adhkar");
  const isArabic = (await getLocale()) === "ar";

  return (
    <ShortcutCard
      href="/adhkar"
      title={t("title")}
      description={t("description")}
      icon={LeafIcon}
      isArabic={isArabic}
    />
  );
}
