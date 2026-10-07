export type MemorizationStatus = "learning" | "memorized";

export type MemorizationUnitType = "ayah" | "range" | "page";

export type MemorizationRow = {
  id: number;
  user_id: string;
  unit_type: MemorizationUnitType;
  surah_number: number;
  start_ayah_number: number;
  end_ayah_number: number | null;
  page_number: number | null;
  status: MemorizationStatus;
  created_at: string;
  memorized_at: string | null;
  updated_at: string;
};

/** Input for creating a memorization unit (no user_id / status). */
export type MemorizationUnitInput =
  | {
      unitType: "ayah";
      surahNumber: number;
      startAyahNumber: number;
      endAyahNumber: number;
      pageNumber?: null;
    }
  | {
      unitType: "range";
      surahNumber: number;
      startAyahNumber: number;
      endAyahNumber: number;
      pageNumber?: null;
    }
  | {
      unitType: "page";
      pageNumber: number;
      /** Populated for NOT NULL columns; not the source of truth for content. */
      surahNumber: number;
      startAyahNumber: number;
      endAyahNumber: number;
    };

export function isMemorizationStatus(
  value: string,
): value is MemorizationStatus {
  return value === "learning" || value === "memorized";
}

export function isMemorizationUnitType(
  value: string,
): value is MemorizationUnitType {
  return value === "ayah" || value === "range" || value === "page";
}

/** Same columns as the server memorization query. Safe to use from the browser client. */
export const MEMORIZATION_ROW_COLUMNS =
  "id, user_id, unit_type, surah_number, start_ayah_number, end_ayah_number, page_number, status, created_at, memorized_at, updated_at";

/**
 * Whether one memorization row covers an ayah on the current Mushaf page.
 * Page units match `page_number`. Ayah and range units match the surah and
 * inclusive ayah numbers — the same span `getAyahRange` resolves for a valid row.
 */
export function memorizationRowCoversPageAyah(
  row: Pick<
    MemorizationRow,
    | "unit_type"
    | "surah_number"
    | "start_ayah_number"
    | "end_ayah_number"
    | "page_number"
  >,
  ayah: { surahNumber: number; ayahNumber: number },
  pageNumber: number,
): boolean {
  if (row.unit_type === "page") {
    return row.page_number === pageNumber;
  }

  if (row.surah_number !== ayah.surahNumber) {
    return false;
  }

  const end = row.end_ayah_number ?? row.start_ayah_number;
  const low = Math.min(row.start_ayah_number, end);
  const high = Math.max(row.start_ayah_number, end);
  return ayah.ayahNumber >= low && ayah.ayahNumber <= high;
}

/** Ayah membership key used by Mushaf chrome highlighting. */
export function ayahMembershipKey(
  surahNumber: number,
  ayahNumber: number,
): string {
  return `${surahNumber}:${ayahNumber}`;
}

/** Exact-duplicate identity for a unit (client/server lookups). */
export function memorizationUnitIdentity(row: {
  unit_type: MemorizationUnitType;
  surah_number: number;
  start_ayah_number: number;
  end_ayah_number: number | null;
  page_number: number | null;
}): string {
  if (row.unit_type === "page") {
    return `page:${row.page_number}`;
  }
  const end = row.end_ayah_number ?? row.start_ayah_number;
  return `${row.unit_type}:${row.surah_number}:${row.start_ayah_number}-${end}`;
}
