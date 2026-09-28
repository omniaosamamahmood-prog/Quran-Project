/**
 * Server-only Tafsir provider.
 *
 * Abstracts Quran Foundation / @quranjs/api so UI and route handlers never
 * touch SDK details, credentials, or tokens. Quran ayah text always comes
 * from the local dataset via `getAyah` — never from the Content API.
 */

import "server-only";

import { createServerClient, QuranHttpError } from "@quranjs/api/server";
import { isValidVerseKey } from "@quranjs/api";
import { unstable_cache } from "next/cache";
import { getAyah } from "@/lib/quran";
import type { TafsirPayload } from "@/types/tafsir";

/** Preferred V1 Arabic Tafsir — confirmed via resources.tafsirs.list(). */
export const PREFERRED_TAFSIR = {
  id: 16,
  slug: "ar-tafsir-muyassar",
  /** Display / source label (Arabic). */
  name: "التفسير الميسر",
} as const;

type QfEnvironment = "prelive" | "production";

const SERVICE_URLS: Record<
  QfEnvironment,
  { gatewayUrl: string; oauth2BaseUrl: string }
> = {
  prelive: {
    gatewayUrl: "https://apis-prelive.quran.foundation",
    oauth2BaseUrl: "https://prelive-oauth2.quran.foundation",
  },
  production: {
    gatewayUrl: "https://apis.quran.foundation",
    oauth2BaseUrl: "https://oauth2.quran.foundation",
  },
};

export type TafsirProviderErrorCode =
  | "config"
  | "auth"
  | "unavailable"
  | "rate_limit"
  | "provider"
  | "ayah_not_found"
  | "invalid_input";

export class TafsirProviderError extends Error {
  readonly code: TafsirProviderErrorCode;
  readonly status: number;
  readonly availableResources?: Array<{
    id: number;
    name: string;
    slug?: string;
    languageName?: string;
  }>;

  constructor(
    code: TafsirProviderErrorCode,
    message: string,
    status: number,
    availableResources?: TafsirProviderError["availableResources"],
  ) {
    super(message);
    this.name = "TafsirProviderError";
    this.code = code;
    this.status = status;
    this.availableResources = availableResources;
  }
}

function resolveEnvironment(): QfEnvironment {
  const raw = (process.env.QURAN_FOUNDATION_ENV ?? "prelive")
    .trim()
    .toLowerCase();

  if (raw === "production" || raw === "prod") {
    return "production";
  }

  return "prelive";
}

function requireCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.QURAN_FOUNDATION_CLIENT_ID?.trim();
  const clientSecret = process.env.QURAN_FOUNDATION_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new TafsirProviderError(
      "config",
      "Quran Foundation credentials are not configured on the server.",
      503,
    );
  }

  return { clientId, clientSecret };
}

function createQfClient() {
  const { clientId, clientSecret } = requireCredentials();
  const environment = resolveEnvironment();

  return createServerClient({
    clientId,
    clientSecret,
    services: SERVICE_URLS[environment],
  });
}

type ListedResource = {
  id: number;
  name: string;
  slug?: string;
  languageName?: string;
};

function summarizeResources(
  resources: Array<{
    id?: number;
    name?: string;
    slug?: string;
    languageName?: string;
  }>,
): ListedResource[] {
  return resources
    .filter(
      (item): item is { id: number; name: string; slug?: string; languageName?: string } =>
        typeof item.id === "number" && typeof item.name === "string",
    )
    .map((item) => ({
      id: item.id,
      name: item.name,
      ...(item.slug ? { slug: item.slug } : {}),
      ...(item.languageName ? { languageName: item.languageName } : {}),
    }));
}

/**
 * Discovers available Tafsir resources and picks the V1 preferred Arabic one.
 * Cached briefly so list() is not hit on every ayah request.
 */
const resolveTafsirResource = unstable_cache(
  async (): Promise<{ id: number; name: string }> => {
    const client = createQfClient();
    const listed = await client.content.v4.resources.tafsirs.list();
    const available = summarizeResources(listed);

    const match =
      available.find((item) => item.id === PREFERRED_TAFSIR.id) ??
      available.find((item) => item.slug === PREFERRED_TAFSIR.slug);

    if (!match) {
      throw new TafsirProviderError(
        "unavailable",
        `Preferred Arabic Tafsir (${PREFERRED_TAFSIR.name}) is not available in this environment.`,
        503,
        available,
      );
    }

    return { id: match.id, name: PREFERRED_TAFSIR.name };
  },
  ["tafsir-resource-v1", PREFERRED_TAFSIR.slug],
  { revalidate: 86_400, tags: ["tafsir-resource"] },
);

async function fetchTafsirText(
  surahNumber: number,
  ayahNumber: number,
  resourceId: number,
): Promise<{ text: string; sourceName?: string }> {
  const client = createQfClient();
  const verseKey = `${surahNumber}:${ayahNumber}`;
  if (!isValidVerseKey(verseKey)) {
    throw new TafsirProviderError(
      "invalid_input",
      "Surah must be 1–114 and ayah must be a positive integer.",
      400,
    );
  }

  const verse = await client.content.v4.verses.byKey(verseKey, {
    tafsirs: [resourceId],
  });

  const entry =
    verse.tafsirs?.find((item) => item.resourceId === resourceId) ??
    verse.tafsirs?.[0];

  const text = entry?.text?.trim();
  if (!text) {
    throw new TafsirProviderError(
      "unavailable",
      "Tafsir content is not available for this ayah in the current provider environment.",
      404,
    );
  }

  return {
    text,
    ...(entry?.resourceName ? { sourceName: entry.resourceName } : {}),
  };
}

const getCachedTafsirText = (
  surahNumber: number,
  ayahNumber: number,
  resourceId: number,
) =>
  unstable_cache(
    async () => fetchTafsirText(surahNumber, ayahNumber, resourceId),
    ["tafsir-ayah", String(surahNumber), String(ayahNumber), String(resourceId)],
    {
      revalidate: 604_800,
      tags: [
        "tafsir",
        `tafsir:${surahNumber}:${ayahNumber}`,
        `tafsir-resource:${resourceId}`,
      ],
    },
  )();

function mapHttpError(error: unknown): never {
  if (error instanceof TafsirProviderError) {
    throw error;
  }

  if (error instanceof QuranHttpError) {
    const status = error.status;

    if (status === 401 || status === 403) {
      throw new TafsirProviderError(
        "auth",
        "Tafsir provider authentication failed.",
        502,
      );
    }

    if (status === 404) {
      throw new TafsirProviderError(
        "unavailable",
        "Tafsir content is not available for this ayah.",
        404,
      );
    }

    if (status === 429) {
      throw new TafsirProviderError(
        "rate_limit",
        "Tafsir provider rate limit reached. Please try again shortly.",
        503,
      );
    }

    throw new TafsirProviderError(
      "provider",
      "Tafsir provider request failed.",
      502,
    );
  }

  throw new TafsirProviderError(
    "provider",
    "Tafsir provider request failed.",
    502,
  );
}

/**
 * Application-level Tafsir lookup.
 * UI and API routes should call this — never the SDK directly.
 */
export async function getTafsir(
  surahNumber: number,
  ayahNumber: number,
): Promise<TafsirPayload> {
  if (
    !Number.isInteger(surahNumber) ||
    surahNumber < 1 ||
    surahNumber > 114 ||
    !Number.isInteger(ayahNumber) ||
    ayahNumber < 1
  ) {
    throw new TafsirProviderError(
      "invalid_input",
      "Surah must be 1–114 and ayah must be a positive integer.",
      400,
    );
  }

  const ayah = getAyah(surahNumber, ayahNumber);
  if (!ayah) {
    throw new TafsirProviderError(
      "ayah_not_found",
      "Ayah not found in the local Quran dataset.",
      404,
    );
  }

  try {
    const resource = await resolveTafsirResource();
    const remote = await getCachedTafsirText(
      surahNumber,
      ayahNumber,
      resource.id,
    );

    return {
      surahNumber: ayah.surahNumber,
      ayahNumber: ayah.ayahNumber,
      surahName: ayah.surahName,
      ayahText: ayah.text,
      tafsir: remote.text,
      // Prefer the centralized Arabic display name over provider English labels.
      sourceName: resource.name,
    };
  } catch (error) {
    mapHttpError(error);
  }
}

/** Exported for diagnostics / future Tafsir selector — server only. */
export function getTafsirEnvironment(): QfEnvironment {
  return resolveEnvironment();
}
