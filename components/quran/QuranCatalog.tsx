"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { JuzList } from "@/components/quran/JuzList";
import { SurahList } from "@/components/quran/SurahList";
import { cn } from "@/lib/cn";
import type { JuzSummary, SurahSummary } from "@/types/quran";

type BrowseTab = "surahs" | "juz";

type QuranCatalogProps = {
  surahs: SurahSummary[];
  juzs: JuzSummary[];
};

type TabButtonProps = {
  id: string;
  controls: string;
  selected: boolean;
  onSelect: () => void;
  children: string;
};

function TabButton({
  id,
  controls,
  selected,
  onSelect,
  children,
}: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      aria-controls={controls}
      onClick={onSelect}
      className={cn(
        "rounded-full px-5 py-1.5 text-sm transition-colors",
        selected
          ? "bg-sage-deep font-medium text-emerald"
          : "text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function QuranCatalog({ surahs, juzs }: QuranCatalogProps) {
  const t = useTranslations("Quran");
  const [tab, setTab] = useState<BrowseTab>("surahs");
  const isSurahs = tab === "surahs";
  const count = isSurahs ? surahs.length : juzs.length;
  const tabId = isSurahs ? "quran-tab-surahs" : "quran-tab-juz";

  return (
    <div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <p className="text-sm text-muted sm:text-base">
          {isSurahs ? t("subtitle") : t("juzSubtitle")}
        </p>
        <span className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 text-[0.75rem] text-muted">
          {count}{" "}
          {isSurahs ? t("surahUnit", { count }) : t("juzUnit", { count })}
        </span>
      </div>

      <div
        role="tablist"
        aria-label={t("browseLabel")}
        className="mt-5 inline-flex rounded-full border border-line bg-surface p-1 shadow-card"
      >
        <TabButton
          id="quran-tab-surahs"
          controls="quran-browse-panel"
          selected={isSurahs}
          onSelect={() => setTab("surahs")}
        >
          {t("tabSurahs")}
        </TabButton>
        <TabButton
          id="quran-tab-juz"
          controls="quran-browse-panel"
          selected={!isSurahs}
          onSelect={() => setTab("juz")}
        >
          {t("tabJuz")}
        </TabButton>
      </div>

      <div role="tabpanel" id="quran-browse-panel" aria-labelledby={tabId}>
        {isSurahs ? (
          <SurahList surahs={surahs} />
        ) : (
          <JuzList juzs={juzs} surahs={surahs} />
        )}
      </div>
    </div>
  );
}
