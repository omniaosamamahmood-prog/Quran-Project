import pageStarts from "@/data/quran-pages.json";
import type { QuranPageStart } from "@/types/quran";

const PAGES = pageStarts as QuranPageStart[];

/**
 * Mushaf page for a surah/ayah, using the same local page-start metadata as
 * `getPageForAyah`. Page starts are ordered, so this does not load Quran text.
 */
export function getMushafPageNumber(
  surahNumber: number,
  ayahNumber: number,
): number | undefined {
  if (
    !Number.isInteger(surahNumber) ||
    !Number.isInteger(ayahNumber) ||
    surahNumber < 1 ||
    ayahNumber < 1
  ) {
    return undefined;
  }

  let low = 0;
  let high = PAGES.length - 1;
  let found: number | undefined;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const start = PAGES[mid];
    if (!start) break;

    const atOrBefore =
      start.sura < surahNumber ||
      (start.sura === surahNumber && start.aya <= ayahNumber);

    if (atOrBefore) {
      found = start.page;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return found;
}
