/**
 * Shape of `data/quran.json`, generated from the Tanzil Uthmani XML by
 * `scripts/convert-quran.ts`.
 *
 * Every Arabic string in this dataset is copied verbatim from the Tanzil
 * source. It must never be normalized, reshaped, stripped of diacritics or
 * re-generated.
 */

export type QuranMeta = {
  /** Source edition title, read from the XML copyright block. */
  edition: string;
  /** Source license, read from the XML copyright block. */
  license: string;
  /** Required attribution for the Tanzil text. */
  attribution: string;
  /** Repo-relative path of the XML the dataset was generated from. */
  sourceFile: string;
  surahCount: number;
  ayahCount: number;
};

export type Ayah = {
  /** 1-based number within the surah (`aya@index` in the source). */
  number: number;
  /** Exact Uthmani text (`aya@text` in the source). */
  text: string;
  /**
   * Basmala preceding the first ayah (`aya@bismillah` in the source). The
   * source carries it for every surah except al-Fatihah, where it is ayah 1,
   * and at-Tawbah, where it is absent.
   */
  bismillah?: string;
};

export type Surah = {
  /** 1-based surah number (`sura@index` in the source). */
  number: number;
  /** Arabic surah name (`sura@name` in the source). */
  name: string;
  ayahs: Ayah[];
};

export type Quran = {
  meta: QuranMeta;
  surahs: Surah[];
};

/**
 * Per-surah metadata without any ayah text, so surah listings can be handed to
 * client components without shipping the dataset to the browser.
 */
export type SurahSummary = {
  number: number;
  name: string;
  ayahCount: number;
  /** Mushaf page that contains ayah 1 of this Surah. */
  firstPage: number;
};

/**
 * One Juz start copied from Tanzil `quran-data.xml` (`<juz index sura aya>`).
 * Stored in `data/quran-juz.json`. Page numbers are not part of this record.
 */
export type JuzBoundary = {
  number: number;
  startSurah: number;
  startAyah: number;
};

/**
 * Juz listing metadata. `startPage` is resolved from `data/quran-pages.json`
 * for the boundary ayah — it is not stored in the Juz file.
 */
export type JuzSummary = {
  number: number;
  startSurah: number;
  startAyah: number;
  startPage: number;
};

/**
 * One `<quarter index sura aya>` copied from Tanzil `<hizbs alias="groups">`.
 * `index` is the source's global quarter number. Stored in `data/quran-rub.json`.
 */
export type RubQuarterSource = {
  index: number;
  startSurah: number;
  startAyah: number;
};

/** Quarter position inside one Hizb, derived from the global Tanzil index. */
export type RubQuarterInHizb = 1 | 2 | 3 | 4;

/**
 * One Rubʿ al-Hizb start. `startPage` is resolved from `quran-pages.json`.
 * `hizbNumber`, `quarterInHizb`, and `juzNumber` are derived from `rubNumber`
 * and checked against the local Juz starts — they are not separate XML fields.
 */
export type RubBoundary = {
  /** Tanzil `<quarter index>`, 1-based across the whole Quran. */
  rubNumber: number;
  hizbNumber: number;
  quarterInHizb: RubQuarterInHizb;
  juzNumber: number;
  startSurah: number;
  startAyah: number;
  startPage: number;
};

/** Marker metadata for one ayah on a Mushaf page. No Quran text. */
export type RubAyahMarker = {
  surahNumber: number;
  ayahNumber: number;
  hizbNumber: number;
  quarterInHizb: RubQuarterInHizb;
};
export type QuranPageStart = {
  page: number;
  sura: number;
  aya: number;
};

/** One ayah on a Mushaf page, with just enough Surah context to render headings. */
export type QuranPageAyah = {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  bismillah?: string;
};

export type QuranPage = {
  pageNumber: number;
  ayahs: QuranPageAyah[];
};
