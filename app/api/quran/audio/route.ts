import { NextResponse } from "next/server";
import {
  getAyahAudio,
  QuranAudioProviderError,
} from "@/lib/quran-audio";
import type { QuranAudioApiError, QuranAudioErrorCode } from "@/types/quran-audio";

export const runtime = "nodejs";
export const revalidate = 604_800;

function parsePositiveInt(value: string | null): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}

function errorResponse(
  status: number,
  error: QuranAudioErrorCode,
  message: string,
) {
  const body: QuranAudioApiError = { error, message };
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const surah = parsePositiveInt(searchParams.get("surah"));
  const ayah = parsePositiveInt(searchParams.get("ayah"));
  const reciter = searchParams.get("reciter")?.trim() || undefined;

  if (surah === null || ayah === null || surah > 114) {
    return errorResponse(
      400,
      "invalid_input",
      "Query params surah (1–114) and ayah (positive integer) are required.",
    );
  }

  try {
    const payload = await getAyahAudio({
      surahNumber: surah,
      ayahNumber: ayah,
      reciterId: reciter,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control":
          "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    if (error instanceof QuranAudioProviderError) {
      return errorResponse(error.status, error.code, error.message);
    }
    return errorResponse(
      502,
      "provider",
      "Audio could not be loaded right now.",
    );
  }
}
