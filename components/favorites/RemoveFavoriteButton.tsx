"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { removeFavorite } from "@/app/actions/favorites";
import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type RemoveFavoriteButtonProps = {
  surahNumber: number;
  ayahNumber: number;
};

export function RemoveFavoriteButton({
  surahNumber,
  ayahNumber,
}: RemoveFavoriteButtonProps) {
  const t = useTranslations("Favorites");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await removeFavorite(surahNumber, ayahNumber);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={t("remove")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5",
        "text-sm text-muted transition-colors hover:border-emerald/30 hover:text-emerald",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35",
        "disabled:cursor-not-allowed disabled:opacity-55",
      )}
    >
      <HeartIcon filled className="h-3.5 w-3.5 text-emerald" />
      {t("remove")}
    </button>
  );
}
