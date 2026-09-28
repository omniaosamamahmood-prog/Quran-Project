/**
 * Server-side access to the local Hisnul Muslim dataset (`data/adhkar.json`).
 * Runtime must not call external Adhkar APIs.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import type {
  AdhkarCategory,
  AdhkarDataset,
  AdhkarItem,
  FeaturedAdhkarEntry,
} from "@/types/adhkar";

const DATA_FILE = join(process.cwd(), "data", "adhkar.json");

const loadAdhkar = cache(
  (): AdhkarDataset =>
    JSON.parse(readFileSync(DATA_FILE, "utf8")) as AdhkarDataset,
);

/** Morning & evening share source category 27 (أذكار الصباح والمساء). */
export const FEATURED_ADHKAR: FeaturedAdhkarEntry[] = [
  { key: "morning", slug: "morning-evening" },
  { key: "evening", slug: "morning-evening" },
  { key: "sleep", slug: "sleep" },
  { key: "waking", slug: "waking" },
  { key: "afterPrayer", slug: "after-prayer" },
  { key: "general", slug: null },
];

export const getAdhkarMeta = cache(() => loadAdhkar().meta);

export const getAdhkarCategories = cache((): AdhkarCategory[] =>
  loadAdhkar().categories,
);

export const getAdhkarItems = cache((): AdhkarItem[] => loadAdhkar().items);

export const getCategoryBySlug = cache(
  (slug: string): AdhkarCategory | undefined =>
    getAdhkarCategories().find((category) => category.slug === slug),
);

export const getItemsByCategorySlug = cache((slug: string): AdhkarItem[] =>
  getAdhkarItems().filter((item) => item.category === slug),
);

export function getCategoryTitle(
  category: AdhkarCategory,
  locale: string,
): string {
  if (locale === "en" && category.titleEn) {
    return category.titleEn;
  }
  return category.titleAr;
}

export function searchAdhkar(
  query: string,
  locale: string,
): Array<{ category: AdhkarCategory; item: AdhkarItem }> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  const categories = getAdhkarCategories();
  const byId = new Map(categories.map((category) => [category.id, category]));
  const results: Array<{ category: AdhkarCategory; item: AdhkarItem }> = [];

  for (const item of getAdhkarItems()) {
    const category = byId.get(item.categoryId);
    if (!category) continue;

    const haystacks = [
      item.arabic,
      item.translation ?? "",
      category.titleAr,
      category.titleEn ?? "",
      item.reference ?? "",
    ];

    if (
      haystacks.some((value) => value.toLowerCase().includes(trimmed)) ||
      (locale === "ar" && item.arabic.includes(query.trim()))
    ) {
      results.push({ category, item });
    }
  }

  return results;
}
