import { createClient } from "@/lib/supabase/server";
import {
  getAyah,
  getAyahRange,
  getPageForAyah,
  getQuranPage,
} from "@/lib/quran";
import {
  ayahMembershipKey,
  memorizationUnitIdentity,
  MEMORIZATION_ROW_COLUMNS,
  type MemorizationRow,
  type MemorizationStatus,
  type MemorizationUnitType,
} from "@/types/memorization";
import type { QuranPageAyah } from "@/types/quran";

export type MemorizationSummary = {
  total: number;
  learning: number;
  memorized: number;
  /** 0–100; 0 when total is 0 (no divide-by-zero). */
  completionPercent: number;
};

/** Trusted Quran content for one memorization unit (never from Supabase). */
export type ResolvedMemorizationUnit = {
  unitType: MemorizationUnitType;
  ayahs: QuranPageAyah[];
  /** Primary Surah name for labels (page units may span Surahs). */
  primarySurahName: string;
  surahNumber: number | null;
  startAyahNumber: number | null;
  endAyahNumber: number | null;
  pageNumber: number | null;
  /** Locale-free app path to open this unit in the Mushaf. */
  mushafHref: string;
  /** Distinct Surah names on the unit (page may have more than one). */
  surahNames: string[];
};

/**
 * Authenticated user's memorization units, newest-first.
 * Empty for guests. Never invents rows. Does not touch public.profiles.
 */
export async function loadMemorizationRows(): Promise<
  { ok: true; rows: MemorizationRow[] } | { ok: false }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: true, rows: [] };
  }

  const { data, error } = await supabase
    .from("memorization")
    .select(MEMORIZATION_ROW_COLUMNS)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return { ok: false };
  }

  return { ok: true, rows: data as MemorizationRow[] };
}

/**
 * Authenticated user's memorization units, newest-first.
 * Empty for guests and when the query fails. Never invents rows.
 * Does not touch public.profiles.
 */
export async function listMemorizations(): Promise<MemorizationRow[]> {
  const result = await loadMemorizationRows();
  return result.ok ? result.rows : [];
}

/**
 * Resolve a memorization unit into trusted local Quran ayahs.
 * Page units use page_number as the source of truth.
 */
export function resolveMemorizationUnit(
  row: Pick<
    MemorizationRow,
    | "unit_type"
    | "surah_number"
    | "start_ayah_number"
    | "end_ayah_number"
    | "page_number"
  >,
): ResolvedMemorizationUnit | null {
  if (row.unit_type === "page") {
    const pageNumber = row.page_number;
    if (pageNumber == null || !Number.isInteger(pageNumber)) {
      return null;
    }

    const page = getQuranPage(pageNumber);
    if (!page || page.ayahs.length === 0) {
      return null;
    }

    const surahNames = [...new Set(page.ayahs.map((a) => a.surahName))];
    const first = page.ayahs[0]!;

    return {
      unitType: "page",
      ayahs: page.ayahs,
      primarySurahName: first.surahName,
      surahNumber: null,
      startAyahNumber: null,
      endAyahNumber: null,
      pageNumber,
      mushafHref: `/quran/page/${pageNumber}`,
      surahNames,
    };
  }

  const end =
    row.end_ayah_number == null
      ? row.start_ayah_number
      : row.end_ayah_number;

  if (row.unit_type === "ayah" || end === row.start_ayah_number) {
    const ayah = getAyah(row.surah_number, row.start_ayah_number);
    if (!ayah) {
      return null;
    }

    const pageNumber = getPageForAyah(ayah.surahNumber, ayah.ayahNumber);
    const mushafHref = pageNumber
      ? `/quran/page/${pageNumber}#ayah-${ayah.surahNumber}-${ayah.ayahNumber}`
      : `/quran/${ayah.surahNumber}#ayah-${ayah.ayahNumber}`;

    return {
      unitType: "ayah",
      ayahs: [ayah],
      primarySurahName: ayah.surahName,
      surahNumber: ayah.surahNumber,
      startAyahNumber: ayah.ayahNumber,
      endAyahNumber: ayah.ayahNumber,
      pageNumber: pageNumber ?? null,
      mushafHref,
      surahNames: [ayah.surahName],
    };
  }

  const ayahs = getAyahRange(row.surah_number, row.start_ayah_number, end);
  if (!ayahs || ayahs.length === 0) {
    return null;
  }

  const first = ayahs[0]!;
  const last = ayahs[ayahs.length - 1]!;
  const pageNumber = getPageForAyah(first.surahNumber, first.ayahNumber);
  const mushafHref = pageNumber
    ? `/quran/page/${pageNumber}#ayah-${first.surahNumber}-${first.ayahNumber}`
    : `/quran/${first.surahNumber}#ayah-${first.ayahNumber}`;

  return {
    unitType: "range",
    ayahs,
    primarySurahName: first.surahName,
    surahNumber: first.surahNumber,
    startAyahNumber: first.ayahNumber,
    endAyahNumber: last.ayahNumber,
    pageNumber: pageNumber ?? null,
    mushafHref,
    surahNames: [first.surahName],
  };
}

/** Expand units into ayah membership keys for Mushaf highlighting. */
export function coveredAyahKeysFromUnit(
  row: Pick<
    MemorizationRow,
    | "unit_type"
    | "surah_number"
    | "start_ayah_number"
    | "end_ayah_number"
    | "page_number"
  >,
): string[] {
  const resolved = resolveMemorizationUnit(row);
  if (!resolved) {
    return [];
  }
  return resolved.ayahs.map((a) =>
    ayahMembershipKey(a.surahNumber, a.ayahNumber),
  );
}

/** Ayah keys covered by any of the user's memorization units. */
export async function getMemorizationKeySet(): Promise<Set<string>> {
  const rows = await listMemorizations();
  const keys = new Set<string>();
  for (const row of rows) {
    for (const key of coveredAyahKeysFromUnit(row)) {
      keys.add(key);
    }
  }
  return keys;
}

/** Exact unit identity set for duplicate checks in the Mushaf chrome. */
export async function getMemorizationUnitIdentitySet(): Promise<Set<string>> {
  const rows = await listMemorizations();
  return new Set(rows.map((row) => memorizationUnitIdentity(row)));
}

export function summarizeMemorizations(
  rows: MemorizationRow[],
): MemorizationSummary {
  let learning = 0;
  let memorized = 0;

  for (const row of rows) {
    if (row.status === "learning") {
      learning += 1;
    } else if (row.status === "memorized") {
      memorized += 1;
    }
  }

  const total = rows.length;
  const completionPercent =
    total === 0 ? 0 : Math.round((memorized / total) * 100);

  return { total, learning, memorized, completionPercent };
}

export function partitionMemorizations(rows: MemorizationRow[]): {
  learning: MemorizationRow[];
  memorized: MemorizationRow[];
} {
  const learning: MemorizationRow[] = [];
  const memorized: MemorizationRow[] = [];

  for (const row of rows) {
    const status: MemorizationStatus = row.status;
    if (status === "memorized") {
      memorized.push(row);
    } else {
      learning.push(row);
    }
  }

  return { learning, memorized };
}

/** Build a page unit insert payload from local page data. */
export function buildPageUnitInput(pageNumber: number): {
  unitType: "page";
  pageNumber: number;
  surahNumber: number;
  startAyahNumber: number;
  endAyahNumber: number;
} | null {
  const page = getQuranPage(pageNumber);
  if (!page || page.ayahs.length === 0) {
    return null;
  }
  const first = page.ayahs[0]!;
  const last = page.ayahs[page.ayahs.length - 1]!;
  return {
    unitType: "page",
    pageNumber,
    surahNumber: first.surahNumber,
    startAyahNumber: first.ayahNumber,
    endAyahNumber: last.ayahNumber,
  };
}
