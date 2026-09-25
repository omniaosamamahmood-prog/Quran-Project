export type FavoriteRow = {
  id: number;
  user_id: string;
  surah_number: number;
  ayah_number: number;
  created_at: string;
};

export function favoriteKey(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

export function parseFavoriteKey(
  key: string,
): { surahNumber: number; ayahNumber: number } | null {
  const [surahPart, ayahPart] = key.split(":");
  const surahNumber = Number(surahPart);
  const ayahNumber = Number(ayahPart);

  if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) {
    return null;
  }

  return { surahNumber, ayahNumber };
}
