import { NextResponse } from "next/server";
import { getTafsir, TafsirProviderError } from "@/lib/tafsir";
import type { TafsirApiError, TafsirErrorCode } from "@/types/tafsir";

export const runtime = "nodejs";

/** Tafsir is effectively static — allow CDN/edge caching of successful responses. */
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
  error: TafsirErrorCode,
  message: string,
  availableResources?: TafsirApiError["availableResources"],
) {
  const body: TafsirApiError = {
    error,
    message,
    ...(availableResources ? { availableResources } : {}),
  };

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const surah = parsePositiveInt(searchParams.get("surah"));
  const ayah = parsePositiveInt(searchParams.get("ayah"));

  if (surah === null || ayah === null || surah > 114) {
    return errorResponse(
      400,
      "invalid_input",
      "Query params surah (1–114) and ayah (positive integer) are required.",
    );
  }

  try {
    const payload = await getTafsir(surah, ayah);

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control":
          "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    if (error instanceof TafsirProviderError) {
      const code: TafsirErrorCode =
        error.code === "invalid_input"
          ? "invalid_input"
          : error.code === "ayah_not_found"
            ? "ayah_not_found"
            : error.code === "config"
              ? "config"
              : error.code === "auth"
                ? "auth"
                : error.code === "unavailable"
                  ? "unavailable"
                  : error.code === "rate_limit"
                    ? "rate_limit"
                    : "provider";

      return errorResponse(
        error.status,
        code,
        error.message,
        error.availableResources,
      );
    }

    return errorResponse(
      502,
      "provider",
      "Tafsir could not be loaded right now.",
    );
  }
}
