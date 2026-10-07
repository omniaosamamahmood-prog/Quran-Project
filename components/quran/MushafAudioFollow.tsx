"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useActiveQuranAyah } from "@/components/audio/AudioProvider";
import { getMushafPageNumber } from "@/lib/mushaf-page";

type MushafAudioFollowProps = {
  pageNumber: number;
};

/**
 * Follows the loaded audio track across Mushaf pages.
 * Mounted only on the page reader, so leaving the Mushaf stops following.
 * The first observed track is ignored so opening another page does not
 * jump back until the track itself changes.
 */
export function MushafAudioFollow({ pageNumber }: MushafAudioFollowProps) {
  const activeAyah = useActiveQuranAyah();
  const router = useRouter();
  const followedKey = useRef<string | null | undefined>(undefined);

  const surahNumber = activeAyah?.surahNumber;
  const ayahNumber = activeAyah?.ayahNumber;

  useEffect(() => {
    const key =
      surahNumber != null && ayahNumber != null
        ? `${surahNumber}:${ayahNumber}`
        : null;

    if (followedKey.current === undefined) {
      followedKey.current = key;
      return;
    }

    if (followedKey.current === key) {
      return;
    }

    followedKey.current = key;

    if (surahNumber == null || ayahNumber == null) {
      return;
    }

    const targetPage = getMushafPageNumber(surahNumber, ayahNumber);
    if (targetPage == null || targetPage === pageNumber) {
      return;
    }

    router.push(`/quran/page/${targetPage}`);
  }, [ayahNumber, pageNumber, router, surahNumber]);

  return null;
}
