export type AdhkarMeta = {
  sourceName: string;
  sourceAuthorAr: string;
  sourceAuthorEn: string;
  contentBasis: string;
  remoteCatalog: string;
  remoteIndexAr: string;
  remoteIndexEn: string;
  importedAt: string;
  attribution: string;
  licenseNote: string;
  verificationNote: string;
  notes: string[];
};

export type AdhkarCategory = {
  id: string;
  slug: string;
  sourceId: number;
  titleAr: string;
  titleEn: string | null;
  itemCount: number;
};

/**
 * Normalized remembrance / dua entry.
 * `arabic` is preserved exactly from the import source.
 * Optional fields stay null when the source did not supply them.
 */
export type AdhkarItem = {
  id: string;
  categoryId: string;
  /** Category slug for routing */
  category: string;
  title?: string | null;
  arabic: string;
  translation?: string | null;
  transliteration?: string | null;
  /** Source-supplied repetition target; null if absent — never invent. */
  repeat: number | null;
  reference?: string | null;
  sourceItemId: number;
};

export type AdhkarDataset = {
  meta: AdhkarMeta;
  categories: AdhkarCategory[];
  items: AdhkarItem[];
};

/** Featured home cards — morning/evening share one source category. */
export type FeaturedAdhkarKey =
  | "morning"
  | "evening"
  | "sleep"
  | "waking"
  | "afterPrayer"
  | "general";

export type FeaturedAdhkarEntry = {
  key: FeaturedAdhkarKey;
  /** null → link to full collection on the home page */
  slug: string | null;
};
