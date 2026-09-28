export type TafsirPayload = {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  ayahText: string;
  tafsir: string;
  sourceName: string;
};

export type TafsirErrorCode =
  | "invalid_input"
  | "ayah_not_found"
  | "config"
  | "auth"
  | "unavailable"
  | "rate_limit"
  | "provider";

export type TafsirApiError = {
  error: TafsirErrorCode;
  message: string;
  availableResources?: Array<{
    id: number;
    name: string;
    slug?: string;
    languageName?: string;
  }>;
};

export type TafsirApiSuccess = TafsirPayload;
