/**
 * Server-only Quran audio provider.
 * Quran text always comes from local data/quran.json.
 * Quran Foundation is used only for audio URL metadata.
 */

import "server-only";

import { createServerClient, QuranHttpError } from "@quranjs/api/server";
import { isValidVerseKey } from "@quranjs/api";
import { unstable_cache } from "next/cache";
import { getAyah } from "@/lib/quran";
import {
  DEFAULT_RECITER_ID,
  V1_RECITERS,
  type AyahAudioPayload,
  type QuranReciter,
} from "@/types/quran-audio";

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

export type QuranAudioProviderErrorCode =
  | "invalid_input"
  | "ayah_not_found"
  | "unsupported_reciter"
  | "unavailable"
  | "config"
  | "auth"
  | "rate_limit"
  | "provider";

export class QuranAudioProviderError extends Error {
  readonly code: QuranAudioProviderErrorCode;
  readonly status: number;

  constructor(
    code: QuranAudioProviderErrorCode,
    message: string,
    status: number,
  ) {
    super(message);
    this.name = "QuranAudioProviderError";
    this.code = code;
    this.status = status;
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
    throw new QuranAudioProviderError(
      "config",
      "Quran Foundation credentials are not configured on the server.",
      503,
    );
  }
  return { clientId, clientSecret };
}

function createQfClient() {
  const { clientId, clientSecret } = requireCredentials();
  return createServerClient({
    clientId,
    clientSecret,
    services: SERVICE_URLS[resolveEnvironment()],
  });
}

export function getSupportedReciters(): readonly QuranReciter[] {
  return V1_RECITERS;
}

export function getReciterById(reciterId: string): QuranReciter | undefined {
  return V1_RECITERS.find((reciter) => reciter.id === reciterId);
}

function resolveAudioUrl(file: {
  audioUrl?: string;
  url?: string;
}): string | null {
  if (file.audioUrl?.trim()) {
    return file.audioUrl.trim();
  }
  const relative = file.url?.trim();
  if (!relative) {
    return null;
  }
  if (relative.startsWith("http://") || relative.startsWith("https://")) {
    return relative;
  }
  return `https://verses.quran.com/${relative.replace(/^\/+/, "")}`;
}

async function fetchVerseAudioUrl(
  surahNumber: number,
  ayahNumber: number,
  recitationId: string,
): Promise<string> {
  const client = createQfClient();
  const verseKey = `${surahNumber}:${ayahNumber}`;
  if (!isValidVerseKey(verseKey)) {
    throw new QuranAudioProviderError(
      "invalid_input",
      "Surah must be 1–114 and ayah must be a positive integer.",
      400,
    );
  }

  const response = await client.content.v4.audio.verseRecitation.byKey(
    verseKey,
    recitationId,
  );
  const file = response.audioFiles?.[0];
  const audioUrl = file ? resolveAudioUrl(file) : null;
  if (!audioUrl) {
    throw new QuranAudioProviderError(
      "unavailable",
      "Audio is not available for this ayah and reciter.",
      404,
    );
  }
  return audioUrl;
}

const getCachedVerseAudioUrl = (
  surahNumber: number,
  ayahNumber: number,
  recitationId: string,
) =>
  unstable_cache(
    async () => fetchVerseAudioUrl(surahNumber, ayahNumber, recitationId),
    [
      "quran-audio-ayah",
      String(surahNumber),
      String(ayahNumber),
      recitationId,
    ],
    {
      revalidate: 604_800,
      tags: [
        "quran-audio",
        `quran-audio:${surahNumber}:${ayahNumber}:${recitationId}`,
      ],
    },
  )();

function mapHttpError(error: unknown): never {
  if (error instanceof QuranAudioProviderError) {
    throw error;
  }
  if (error instanceof QuranHttpError) {
    if (error.status === 401 || error.status === 403) {
      throw new QuranAudioProviderError(
        "auth",
        "Audio provider authentication failed.",
        502,
      );
    }
    if (error.status === 404) {
      throw new QuranAudioProviderError(
        "unavailable",
        "Audio is not available for this ayah and reciter.",
        404,
      );
    }
    if (error.status === 429) {
      throw new QuranAudioProviderError(
        "rate_limit",
        "Audio provider rate limit reached. Please try again shortly.",
        503,
      );
    }
    throw new QuranAudioProviderError(
      "provider",
      "Audio provider request failed.",
      502,
    );
  }
  throw new QuranAudioProviderError(
    "provider",
    "Audio provider request failed.",
    502,
  );
}

export async function getAyahAudio(input: {
  surahNumber: number;
  ayahNumber: number;
  reciterId?: string;
}): Promise<AyahAudioPayload> {
  const { surahNumber, ayahNumber } = input;
  const reciterId = input.reciterId?.trim() || DEFAULT_RECITER_ID;

  if (
    !Number.isInteger(surahNumber) ||
    surahNumber < 1 ||
    surahNumber > 114 ||
    !Number.isInteger(ayahNumber) ||
    ayahNumber < 1
  ) {
    throw new QuranAudioProviderError(
      "invalid_input",
      "Surah must be 1–114 and ayah must be a positive integer.",
      400,
    );
  }

  const reciter = getReciterById(reciterId);
  if (!reciter) {
    throw new QuranAudioProviderError(
      "unsupported_reciter",
      "That reciter is not supported in Audio V1.",
      400,
    );
  }

  const ayah = getAyah(surahNumber, ayahNumber);
  if (!ayah) {
    throw new QuranAudioProviderError(
      "ayah_not_found",
      "Ayah not found in the local Quran dataset.",
      404,
    );
  }

  try {
    const audioUrl = await getCachedVerseAudioUrl(
      surahNumber,
      ayahNumber,
      reciter.recitationId,
    );

    return {
      surahNumber: ayah.surahNumber,
      ayahNumber: ayah.ayahNumber,
      verseKey: `${ayah.surahNumber}:${ayah.ayahNumber}`,
      surahName: ayah.surahName,
      ayahText: ayah.text,
      reciterId: reciter.id,
      reciterNameAr: reciter.nameAr,
      reciterNameEn: reciter.nameEn,
      audioUrl,
    };
  } catch (error) {
    mapHttpError(error);
  }
}
