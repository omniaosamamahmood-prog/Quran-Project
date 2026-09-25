/**
 * Converts the verified Tanzil Uthmani XML into `data/quran.json`, then
 * validates the result against the source.
 *
 * Run with: npm run convert:quran
 *
 * The XML is treated as read-only. Quranic strings are lifted straight out of
 * the source attributes and written unchanged: no trimming, normalization,
 * reshaping, diacritic handling or entity decoding. The parser asserts that the
 * source contains no XML entities, which is what makes verbatim copying safe.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// Type-only import: Node erases it while stripping types, so the `@/*` alias
// never needs to resolve at runtime. Keep it type-only.
import type { Ayah, Quran, Surah } from "@/types/quran";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Candidate source names; the download arrived with a doubled extension. */
const SOURCE_CANDIDATES = [
  "data/quran-uthmani.xml",
  "data/quran-uthmani.xml.xml",
];
const OUTPUT_FILE = "data/quran.json";
const ATTRIBUTION = "Tanzil Project — https://tanzil.net";

type ParsedAyah = Ayah & { surah: number };

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function locateSource(): string {
  for (const candidate of SOURCE_CANDIDATES) {
    if (existsSync(join(ROOT, candidate))) return candidate;
  }
  throw new Error(
    `Tanzil XML not found. Looked for: ${SOURCE_CANDIDATES.join(", ")}`,
  );
}

/**
 * Reads double-quoted attributes off a raw tag body and fails if any part of
 * the tag could not be accounted for, so nothing is silently skipped.
 */
function readAttributes(tagBody: string, where: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const pattern = /([a-zA-Z_][\w.:-]*)="([^"]*)"/g;

  for (const match of tagBody.matchAll(pattern)) {
    if (attributes.has(match[1])) {
      throw new Error(`${where}: duplicate attribute "${match[1]}"`);
    }
    attributes.set(match[1], match[2]);
  }

  const unparsed = tagBody.replace(pattern, "").replace(/[\s/]+/g, "");
  if (unparsed !== "") {
    throw new Error(`${where}: unparsed tag content ${JSON.stringify(unparsed)}`);
  }

  return attributes;
}

function requireAttribute(
  attributes: Map<string, string>,
  name: string,
  where: string,
): string {
  const value = attributes.get(name);
  if (value === undefined) throw new Error(`${where}: missing "${name}"`);
  return value;
}

function requireIndex(raw: string, where: string): number {
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${where}: index ${JSON.stringify(raw)} is not a number`);
  }
  return Number(raw);
}

/**
 * Guards verbatim copying: any markup character would mean the source uses
 * entities and that raw attribute values could not be trusted as final text.
 */
function requireVerbatim(value: string, where: string): string {
  if (/[<>&]/.test(value)) {
    throw new Error(`${where}: contains XML markup characters, cannot copy verbatim`);
  }
  return value;
}

function readProvenance(xml: string, label: string): string {
  const patterns: Record<string, RegExp> = {
    edition: /^#\s+(Tanzil Quran Text \([^)]*\))/m,
    license: /^#\s+License:\s*(\S.*?)\s*$/m,
  };
  const match = xml.match(patterns[label]);
  if (!match) {
    throw new Error(`Could not read ${label} from the XML copyright block`);
  }
  return match[1];
}

function parseSurahs(xml: string): Surah[] {
  const surahs: Surah[] = [];
  const suraBlock = /<sura\b([^>]*)>([\s\S]*?)<\/sura>/g;
  const ayaTag = /<aya\b([^>]*?)\/>/g;

  for (const block of xml.matchAll(suraBlock)) {
    const [, tagBody, body] = block;
    const attributes = readAttributes(tagBody, "sura");
    const number = requireIndex(
      requireAttribute(attributes, "index", "sura"),
      "sura",
    );
    const where = `sura ${number}`;
    const name = requireVerbatim(
      requireAttribute(attributes, "name", where),
      `${where} name`,
    );

    const ayahs: Ayah[] = [];
    for (const tag of body.matchAll(ayaTag)) {
      const ayaAttributes = readAttributes(tag[1], where);
      const ayahNumber = requireIndex(
        requireAttribute(ayaAttributes, "index", where),
        where,
      );
      const at = `${where}:${ayahNumber}`;
      const ayah: Ayah = {
        number: ayahNumber,
        text: requireVerbatim(
          requireAttribute(ayaAttributes, "text", at),
          `${at} text`,
        ),
      };

      const bismillah = ayaAttributes.get("bismillah");
      if (bismillah !== undefined) {
        ayah.bismillah = requireVerbatim(bismillah, `${at} bismillah`);
      }

      ayahs.push(ayah);
    }

    // The block regex must have seen every <aya in this surah.
    const rawAyaCount = (body.match(/<aya\b/g) ?? []).length;
    if (ayahs.length !== rawAyaCount) {
      throw new Error(
        `${where}: parsed ${ayahs.length} ayahs but the source has ${rawAyaCount}`,
      );
    }

    surahs.push({ number, name, ayahs });
  }

  // ...and every <sura in the document.
  const rawSuraCount = (xml.match(/<sura\b/g) ?? []).length;
  if (surahs.length !== rawSuraCount) {
    throw new Error(
      `Parsed ${surahs.length} surahs but the source has ${rawSuraCount}`,
    );
  }

  return surahs;
}

function flatten(surahs: Surah[]): ParsedAyah[] {
  return surahs.flatMap((surah) =>
    surah.ayahs.map((ayah) => ({ ...ayah, surah: surah.number })),
  );
}

function digestOf(ayahs: ParsedAyah[]): string {
  const hash = createHash("sha256");
  for (const ayah of ayahs) {
    hash.update(`${ayah.surah}:${ayah.number}:${ayah.text}\n`, "utf8");
  }
  return hash.digest("hex");
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

type Check = { label: string; passed: boolean; detail: string };

function validate(generated: Quran, source: Surah[]): Check[] {
  const checks: Check[] = [];
  const add = (label: string, passed: boolean, detail: string) =>
    checks.push({ label, passed, detail });

  const surahs = generated.surahs;
  const generatedAyahs = flatten(surahs);
  const sourceAyahs = flatten(source);

  add("exactly 114 surahs", surahs.length === 114, `${surahs.length} surahs`);

  const missingNumber = surahs.filter(
    (surah) => !Number.isInteger(surah.number) || surah.number < 1,
  );
  add(
    "every surah has a valid number",
    missingNumber.length === 0,
    `${surahs.length - missingNumber.length}/${surahs.length} valid`,
  );

  const uniqueNumbers = new Set(surahs.map((surah) => surah.number));
  add(
    "surah numbers are unique",
    uniqueNumbers.size === surahs.length,
    `${uniqueNumbers.size} distinct`,
  );

  const outOfOrder = surahs.filter((surah, index) => surah.number !== index + 1);
  add(
    "surah numbers run 1..114 in order",
    outOfOrder.length === 0,
    outOfOrder.length === 0
      ? "ordered"
      : `first break at position ${surahs.indexOf(outOfOrder[0]) + 1}`,
  );

  const unnamed = surahs.filter((surah) => surah.name.trim() === "");
  add(
    "every surah has a name",
    unnamed.length === 0,
    `${surahs.length - unnamed.length}/${surahs.length} named`,
  );

  const empty = generatedAyahs.filter((ayah) => ayah.text.trim() === "");
  add(
    "no ayah has empty text",
    empty.length === 0,
    empty.length === 0
      ? `${generatedAyahs.length} non-empty`
      : `${empty.length} empty`,
  );

  const badSequence = surahs.filter((surah) =>
    surah.ayahs.some((ayah, index) => ayah.number !== index + 1),
  );
  add(
    "ayah numbers are sequential from 1 within each surah",
    badSequence.length === 0,
    badSequence.length === 0
      ? "all surahs sequential"
      : `broken in surah ${badSequence[0].number}`,
  );

  add(
    "total ayah count matches the source XML",
    generatedAyahs.length === sourceAyahs.length,
    `${generatedAyahs.length} generated vs ${sourceAyahs.length} in XML`,
  );

  const mismatches = sourceAyahs.filter((sourceAyah, index) => {
    const generatedAyah = generatedAyahs[index];
    return (
      generatedAyah === undefined ||
      generatedAyah.surah !== sourceAyah.surah ||
      generatedAyah.number !== sourceAyah.number ||
      generatedAyah.text !== sourceAyah.text ||
      generatedAyah.bismillah !== sourceAyah.bismillah
    );
  });
  add(
    "ayah text matches the XML character for character",
    mismatches.length === 0,
    mismatches.length === 0
      ? `${sourceAyahs.length} ayahs identical`
      : `${mismatches.length} differ, first at ${mismatches[0].surah}:${mismatches[0].number}`,
  );

  const nameMismatches = source.filter(
    (sourceSurah, index) => surahs[index]?.name !== sourceSurah.name,
  );
  add(
    "surah names match the XML",
    nameMismatches.length === 0,
    nameMismatches.length === 0
      ? `${source.length} names identical`
      : `${nameMismatches.length} differ`,
  );

  const generatedDigest = digestOf(generatedAyahs);
  const sourceDigest = digestOf(sourceAyahs);
  add(
    "sha256 of all ayah text is identical",
    generatedDigest === sourceDigest,
    generatedDigest.slice(0, 16),
  );

  return checks;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

function main(): void {
  const sourceFile = locateSource();
  const xml = readFileSync(join(ROOT, sourceFile), "utf8");

  const surahs = parseSurahs(xml);
  const ayahCount = surahs.reduce((total, surah) => total + surah.ayahs.length, 0);

  const quran: Quran = {
    meta: {
      edition: readProvenance(xml, "edition"),
      license: readProvenance(xml, "license"),
      attribution: ATTRIBUTION,
      sourceFile,
      surahCount: surahs.length,
      ayahCount,
    },
    surahs,
  };

  writeFileSync(join(ROOT, OUTPUT_FILE), `${JSON.stringify(quran, null, 2)}\n`, "utf8");

  // Validate what actually landed on disk, re-parsing the XML independently.
  const written = JSON.parse(
    readFileSync(join(ROOT, OUTPUT_FILE), "utf8"),
  ) as Quran;
  const checks = validate(written, parseSurahs(xml));
  const failed = checks.filter((check) => !check.passed);
  const sizeMb = (statSync(join(ROOT, OUTPUT_FILE)).size / 1024 / 1024).toFixed(2);

  console.log("");
  console.log("Quran dataset conversion");
  console.log(`  source   ${sourceFile}`);
  console.log(`  edition  ${written.meta.edition}`);
  console.log(`  license  ${written.meta.license} (${written.meta.attribution})`);
  console.log(`  output   ${OUTPUT_FILE} (${sizeMb} MB)`);
  console.log("");
  console.log("Validation");

  const width = Math.max(...checks.map((check) => check.label.length));
  for (const check of checks) {
    const status = check.passed ? "PASS" : "FAIL";
    console.log(`  ${status}  ${check.label.padEnd(width)}  ${check.detail}`);
  }

  console.log("");
  console.log(
    `  surahs ${written.meta.surahCount}  |  ayahs ${written.meta.ayahCount}  |  text sha256 ${digestOf(flatten(written.surahs))}`,
  );
  console.log("");

  if (failed.length > 0) {
    console.error(`${failed.length} check(s) FAILED — dataset is not trustworthy.`);
    process.exitCode = 1;
    return;
  }

  console.log("All checks passed.");
}

main();
