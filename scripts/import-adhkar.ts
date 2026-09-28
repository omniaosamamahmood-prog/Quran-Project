/**
 * One-time / maintainable import of Hisnul Muslim content from hisnmuslim.com.
 *
 * Runtime app reads only data/adhkar.json — never this script or the remote API.
 *
 * Usage: node scripts/import-adhkar.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

type HisnIndexEntry = {
  ID: number;
  TITLE: string;
  AUDIO_URL?: string;
  TEXT: string;
};

type HisnItem = {
  ID: number;
  ARABIC_TEXT?: string;
  Text?: string;
  TRANSLATED_TEXT?: string;
  LANGUAGE_ARABIC_TRANSLATED_TEXT?: string;
  REPEAT?: number | string;
  AUDIO?: string;
  REFERENCE?: string;
};

const ROOT = process.cwd();
const OUT = join(ROOT, "data", "adhkar.json");

/** Stable slugs for V1 featured categories (source IDs from hisnmuslim.com). */
const SLUG_BY_SOURCE_ID: Record<number, string> = {
  1: "waking",
  25: "after-prayer",
  27: "morning-evening",
  28: "sleep",
};

function slugify(input: string, fallback: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || fallback;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status}`);
  }
  // Some hisnmuslim.com payloads include raw control characters inside strings.
  let raw = await response.text();
  // Strip UTF-8 BOM if present.
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1);
  }

  const cleaned = raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/\r/g, "");

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Escape bare newlines that appear inside JSON string values.
    let inString = false;
    let escaped = false;
    let out = "";
    for (let i = 0; i < cleaned.length; i += 1) {
      const ch = cleaned[i]!;
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        out += ch;
        continue;
      }
      if (inString && ch === "\n") {
        out += "\\n";
        continue;
      }
      if (inString && ch === "\t") {
        out += "\\t";
        continue;
      }
      out += ch;
    }

    try {
      return JSON.parse(out) as T;
    } catch (inner) {
      throw new Error(
        `JSON parse failed for ${url}: ${inner instanceof Error ? inner.message : String(inner)} (snippet=${JSON.stringify(cleaned.slice(0, 80))})`,
      );
    }
  }
}

function parseRepeat(value: number | string | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(n) || n < 1) {
    return null;
  }
  return n;
}

async function main() {
  const arIndex = await fetchJson<Record<string, HisnIndexEntry[]>>(
    "https://www.hisnmuslim.com/api/ar/husn_ar.json",
  );
  const enIndex = await fetchJson<Record<string, HisnIndexEntry[]>>(
    "https://www.hisnmuslim.com/api/en/husn_en.json",
  );

  const arCats = arIndex["العربية"] ?? [];
  const enCats = enIndex.English ?? enIndex["English"] ?? [];
  const enById = new Map(enCats.map((c) => [c.ID, c]));

  const categories: Array<{
    id: string;
    slug: string;
    sourceId: number;
    titleAr: string;
    titleEn: string | null;
    itemCount: number;
  }> = [];

  const items: Array<{
    id: string;
    categoryId: string;
    category: string;
    title: string | null;
    arabic: string;
    translation: string | null;
    transliteration: string | null;
    repeat: number | null;
    reference: string | null;
    sourceItemId: number;
  }> = [];

  const usedSlugs = new Set<string>();

  for (const cat of arCats) {
    const enCat = enById.get(cat.ID);
    let slug =
      SLUG_BY_SOURCE_ID[cat.ID] ??
      slugify(enCat?.TITLE ?? "", `category-${cat.ID}`);
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${cat.ID}`;
    }
    usedSlugs.add(slug);

    const categoryId = String(cat.ID);

    const arPayload = await fetchJson<Record<string, HisnItem[]>>(
      `https://www.hisnmuslim.com/api/ar/${cat.ID}.json`,
    );
    const arList = arPayload[Object.keys(arPayload)[0]!] ?? [];

    let enList: HisnItem[] = [];
    try {
      const enPayload = await fetchJson<Record<string, HisnItem[]>>(
        `https://www.hisnmuslim.com/api/en/${cat.ID}.json`,
      );
      enList = enPayload[Object.keys(enPayload)[0]!] ?? [];
    } catch (error) {
      console.warn(
        `EN category ${cat.ID} skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    const enItemById = new Map(enList.map((item) => [item.ID, item]));

    let added = 0;
    for (const raw of arList) {
      const arabic = String(raw.ARABIC_TEXT ?? raw.Text ?? "").trim();
      if (!arabic) {
        continue;
      }

      const enItem = enItemById.get(raw.ID);
      const translation =
        String(enItem?.TRANSLATED_TEXT ?? raw.TRANSLATED_TEXT ?? "").trim() ||
        null;
      const transliteration =
        String(
          enItem?.LANGUAGE_ARABIC_TRANSLATED_TEXT ??
            raw.LANGUAGE_ARABIC_TRANSLATED_TEXT ??
            "",
        ).trim() || null;
      const reference =
        String(raw.REFERENCE ?? enItem?.REFERENCE ?? "").trim() || null;
      const repeat = parseRepeat(raw.REPEAT ?? enItem?.REPEAT);

      items.push({
        id: `${categoryId}-${raw.ID}`,
        categoryId,
        category: slug,
        title: null,
        arabic,
        translation,
        transliteration,
        repeat,
        reference,
        sourceItemId: raw.ID,
      });
      added += 1;
    }

    categories.push({
      id: categoryId,
      slug,
      sourceId: cat.ID,
      titleAr: cat.TITLE,
      titleEn: enCat?.TITLE?.trim() || null,
      itemCount: added,
    });

    // Be polite to the remote host during one-time import.
    await new Promise((r) => setTimeout(r, 40));
  }

  const dataset = {
    meta: {
      sourceName: "Hisnul Muslim (حصن المسلم)",
      sourceAuthorAr: "سعيد بن علي بن وهف القحطاني",
      sourceAuthorEn: "Sa'id bin Ali bin Wahf Al-Qahtani",
      contentBasis: "Hisnul Muslim — Fortress of the Muslim",
      remoteCatalog: "https://www.hisnmuslim.com",
      remoteIndexAr: "https://www.hisnmuslim.com/api/ar/husn_ar.json",
      remoteIndexEn: "https://www.hisnmuslim.com/api/en/husn_en.json",
      importedAt: new Date().toISOString(),
      attribution:
        "Arabic and English remembrance texts and repetition counts were imported from the public hisnmuslim.com category JSON endpoints, which present content attributed to Hisnul Muslim by Sa'id bin Ali bin Wahf Al-Qahtani. This project did not author or rewrite the religious text.",
      licenseNote:
        "hisnmuslim.com does not publish an explicit open-source license in the fetched API responses. Treat the imported text as third-party religious content: retain attribution, do not claim original authorship, and review redistribution rights for your deployment jurisdiction.",
      verificationNote:
        "This dataset is NOT independently religiously verified by Quran Companion. Presence in a file named after Hisnul Muslim or served by hisnmuslim.com does not guarantee textual authenticity, hadith grading, or editorial accuracy. References are included only when present in the source payload (often absent).",
      notes: [
        "Morning and evening remembrances are a single source category (ID 27: أذكار الصباح والمساء); they are not split in the source.",
        "REFERENCE fields were absent from the hisnmuslim.com item payloads at import time; reference is stored as null unless supplied by the source.",
        "REPEAT values are taken only from the source; missing/invalid repeats are stored as null and must not be invented in the UI.",
      ],
    },
    categories,
    items,
  };

  mkdirSync(join(ROOT, "data"), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        out: OUT,
        categories: categories.length,
        items: items.length,
        emptyArabic: items.filter((i) => !i.arabic).length,
        withTranslation: items.filter((i) => i.translation).length,
        withRepeat: items.filter((i) => i.repeat != null).length,
        withReference: items.filter((i) => i.reference).length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
