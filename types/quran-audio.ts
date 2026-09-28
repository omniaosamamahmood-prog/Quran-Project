/**
 * V1 curated reciters — IDs confirmed via production
 * `client.content.v4.resources.recitations.list()`.
 */
export type QuranReciter = {
  /** App-facing id (same as Quran Foundation recitation id for V1). */
  id: string;
  nameAr: string;
  nameEn: string;
  /** Quran Foundation recitation resource id passed to verseRecitation.byKey */
  recitationId: string;
};

export const V1_RECITERS: readonly QuranReciter[] = [
  {
    id: "7",
    nameAr: "مشاري راشد العفاسي",
    nameEn: "Mishari Rashid al-Afasy",
    recitationId: "7",
  },
  {
    id: "2",
    nameAr: "عبد الباسط عبد الصمد (مرتل)",
    nameEn: "AbdulBaset AbdulSamad (Murattal)",
    recitationId: "2",
  },
  {
    id: "6",
    nameAr: "محمود خليل الحصري",
    nameEn: "Mahmoud Khalil Al-Husary",
    recitationId: "6",
  },
  {
    id: "3",
    nameAr: "عبدالرحمن السديس",
    nameEn: "Abdur-Rahman as-Sudais",
    recitationId: "3",
  },
  {
    id: "9",
    nameAr: "محمد صديق المنشاوي (مرتل)",
    nameEn: "Mohamed Siddiq al-Minshawi (Murattal)",
    recitationId: "9",
  },
] as const;

export const DEFAULT_RECITER_ID = V1_RECITERS[0]!.id;

export type AyahAudioPayload = {
  surahNumber: number;
  ayahNumber: number;
  verseKey: string;
  surahName: string;
  ayahText: string;
  reciterId: string;
  reciterNameAr: string;
  reciterNameEn: string;
  audioUrl: string;
};

export type QuranAudioErrorCode =
  | "invalid_input"
  | "ayah_not_found"
  | "unsupported_reciter"
  | "unavailable"
  | "config"
  | "auth"
  | "rate_limit"
  | "provider";

export type QuranAudioApiError = {
  error: QuranAudioErrorCode;
  message: string;
};
