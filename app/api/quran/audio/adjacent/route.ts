import { NextResponse } from "next/server";
import { getAdjacentAyah, getAyah } from "@/lib/quran";

export const runtime = "nodejs";

function parsePositiveInt(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const surah = parsePositiveInt(searchParams.get("surah"));
  const ayah = parsePositiveInt(searchParams.get("ayah"));
  const direction = searchParams.get("direction");

  if (
    surah === null ||
    ayah === null ||
    surah > 114 ||
    (direction !== "next" && direction !== "previous")
  ) {
    return NextResponse.json(
      { error: "invalid_input", message: "Invalid adjacent audio query." },
      { status: 400 },
    );
  }

  if (!getAyah(surah, ayah)) {
    return NextResponse.json(
      { error: "ayah_not_found", message: "Ayah not found." },
      { status: 404 },
    );
  }

  const adjacent = getAdjacentAyah(surah, ayah, direction);
  if (!adjacent) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    surahNumber: adjacent.surahNumber,
    ayahNumber: adjacent.ayahNumber,
    surahName: adjacent.surahName,
    ayahText: adjacent.text,
  });
}
