"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AyahNumber } from "@/components/quran/AyahNumber";
import { RubAlHizbMarker } from "@/components/quran/RubAlHizbMarker";
import { FavoriteToggle } from "@/components/favorites/FavoriteToggle";
import { loadSessionFavoriteKeys } from "@/components/favorites/session-favorites";
import { MemorizeUnitButton } from "@/components/memorization/MemorizeUnitButton";
import { loadSessionMemorizationRows } from "@/components/memorization/session-memorization";
import { SaveReadingPosition } from "@/components/reading-progress/SaveReadingPosition";
import { ListenAyahButton } from "@/components/audio/ListenAyahButton";
import { useActiveQuranAyah } from "@/components/audio/AudioProvider";
import { TafsirActionButton } from "@/components/tafsir/TafsirActionButton";
import { MushafPageFrame } from "@/components/quran/MushafPageFrame";
import { cn } from "@/lib/cn";
import { favoriteKey } from "@/types/favorites";
import {
  ayahMembershipKey,
  memorizationRowCoversPageAyah,
  memorizationUnitIdentity,
} from "@/types/memorization";
import type { QuranPageAyah, RubAyahMarker } from "@/types/quran";

type SurahSegment = {
  surahNumber: number;
  surahName: string;
  ayahs: QuranPageAyah[];
};

type MushafInteractiveLeafProps = {
  segments: SurahSegment[];
  isCompact: boolean;
  pageNumber: number;
  pageNumberLabel: string;
  returnPath: string;
  /** Rubʿ starts on this page only. Empty when the page has none. */
  rubMarkers: RubAyahMarker[];
};

type SelectedAyah = {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  ayahText: string;
};

type RangeMode = {
  surahNumber: number;
  surahName: string;
  startAyahNumber: number;
};

/**
 * Mushaf leaf interaction:
 * - Quran text stays non-interactive for calm reading
 * - Tap ayah medallion → shared chrome (Favorites, reading position, memorization, Tafsir, Listen)
 * - Optional same-Surah range selection mode
 */
export function MushafInteractiveLeaf({
  segments,
  isCompact,
  pageNumber,
  pageNumberLabel,
  returnPath,
  rubMarkers,
}: MushafInteractiveLeafProps) {
  const tQuran = useTranslations("Quran");
  const tFavorites = useTranslations("Favorites");
  const tMemorization = useTranslations("Memorization");
  const tTafsir = useTranslations("Tafsir");
  const activeAyah = useActiveQuranAyah();
  const [selected, setSelected] = useState<SelectedAyah | null>(null);
  const [rangeMode, setRangeMode] = useState<RangeMode | null>(null);
  const [rangeError, setRangeError] = useState("");
  const [pendingRangeEnd, setPendingRangeEnd] = useState<SelectedAyah | null>(
    null,
  );
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({});
  const [membershipMap, setMembershipMap] = useState<Record<string, boolean>>(
    {},
  );
  const [unitIdMap, setUnitIdMap] = useState<Record<string, boolean>>({});
  const pageAyahs = segments.flatMap((segment) => segment.ayahs);
  const pageFirst = pageAyahs[0];
  const pageLast = pageAyahs[pageAyahs.length - 1];

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      loadSessionFavoriteKeys(),
      loadSessionMemorizationRows(),
    ]).then(([favoriteKeys, rows]) => {
      if (cancelled) return;

      const ayahs = segments.flatMap((segment) => segment.ayahs);
      const favorites: Record<string, boolean> = {};
      for (const key of favoriteKeys) {
        favorites[key] = true;
      }

      const membership: Record<string, boolean> = {};
      const units: Record<string, boolean> = {};
      for (const row of rows) {
        units[memorizationUnitIdentity(row)] = true;
        for (const ayah of ayahs) {
          if (memorizationRowCoversPageAyah(row, ayah, pageNumber)) {
            membership[ayahMembershipKey(ayah.surahNumber, ayah.ayahNumber)] =
              true;
          }
        }
      }

      setFavoriteMap(favorites);
      setMembershipMap(membership);
      setUnitIdMap(units);
    });

    return () => {
      cancelled = true;
    };
  }, [pageNumber, segments]);

  function isFavorited(surahNumber: number, ayahNumber: number): boolean {
    return favoriteMap[favoriteKey(surahNumber, ayahNumber)] === true;
  }

  function isCoveredByMemorization(
    surahNumber: number,
    ayahNumber: number,
  ): boolean {
    return membershipMap[ayahMembershipKey(surahNumber, ayahNumber)] === true;
  }

  function unitAlreadyAdded(identity: string): boolean {
    return unitIdMap[identity] === true;
  }

  function markUnitAdded(identity: string, coveredKeys: string[]) {
    setUnitIdMap((current) => ({ ...current, [identity]: true }));
    setMembershipMap((current) => {
      const next = { ...current };
      for (const key of coveredKeys) {
        next[key] = true;
      }
      return next;
    });
  }

  function cancelRangeMode() {
    setRangeMode(null);
    setPendingRangeEnd(null);
    setRangeError("");
  }

  function selectAyah(ayah: QuranPageAyah) {
    setRangeError("");

    if (rangeMode) {
      if (ayah.surahNumber !== rangeMode.surahNumber) {
        setRangeError(tMemorization("mushaf.crossSurahError"));
        setPendingRangeEnd(null);
        return;
      }

      setPendingRangeEnd({
        surahNumber: ayah.surahNumber,
        surahName: ayah.surahName,
        ayahNumber: ayah.ayahNumber,
        ayahText: ayah.text,
      });
      setSelected({
        surahNumber: ayah.surahNumber,
        surahName: ayah.surahName,
        ayahNumber: ayah.ayahNumber,
        ayahText: ayah.text,
      });
      return;
    }

    setSelected({
      surahNumber: ayah.surahNumber,
      surahName: ayah.surahName,
      ayahNumber: ayah.ayahNumber,
      ayahText: ayah.text,
    });
  }

  function startRangeSelection() {
    if (!selected) {
      return;
    }
    setRangeMode({
      surahNumber: selected.surahNumber,
      surahName: selected.surahName,
      startAyahNumber: selected.ayahNumber,
    });
    setPendingRangeEnd(null);
    setRangeError("");
  }

  const ayahReturnPath = selected
    ? `${returnPath}#ayah-${selected.surahNumber}-${selected.ayahNumber}`
    : returnPath;

  const ayahIdentity = selected
    ? memorizationUnitIdentity({
        unit_type: "ayah",
        surah_number: selected.surahNumber,
        start_ayah_number: selected.ayahNumber,
        end_ayah_number: selected.ayahNumber,
        page_number: null,
      })
    : "";

  const pageIdentity = memorizationUnitIdentity({
    unit_type: "page",
    surah_number: pageFirst?.surahNumber ?? 0,
    start_ayah_number: pageFirst?.ayahNumber ?? 0,
    end_ayah_number: pageLast?.ayahNumber ?? 0,
    page_number: pageNumber,
  });

  const rangeStart = rangeMode
    ? Math.min(
        rangeMode.startAyahNumber,
        pendingRangeEnd?.ayahNumber ?? rangeMode.startAyahNumber,
      )
    : 0;
  const rangeEnd = rangeMode
    ? Math.max(
        rangeMode.startAyahNumber,
        pendingRangeEnd?.ayahNumber ?? rangeMode.startAyahNumber,
      )
    : 0;

  const rangeIdentity =
    rangeMode && pendingRangeEnd
      ? memorizationUnitIdentity({
          unit_type:
            rangeStart === rangeEnd ? "ayah" : "range",
          surah_number: rangeMode.surahNumber,
          start_ayah_number: rangeStart,
          end_ayah_number: rangeEnd,
          page_number: null,
        })
      : "";

  return (
    <>
      <article className="mushaf-reader-page">
        <MushafPageFrame>
          <div
            lang="ar"
            dir="rtl"
            className={cn(
              "mushaf-quran font-quran",
              isCompact && "mushaf-quran--compact",
            )}
          >
            {segments.map((segment) => {
              const startsSurah = segment.ayahs[0]?.ayahNumber === 1;
              const bismillah = segment.ayahs[0]?.bismillah;

              return (
                <section
                  key={segment.surahNumber}
                  className="mushaf-surah-block"
                  aria-label={segment.surahName}
                >
                  {startsSurah ? (
                    <h2 className="mushaf-surah-title">
                      <span aria-hidden className="mushaf-surah-rule" />
                      <span className="mushaf-surah-name">
                        {tQuran("pageReader.surahTitle", {
                          name: segment.surahName,
                        })}
                      </span>
                      <span aria-hidden className="mushaf-surah-rule" />
                    </h2>
                  ) : null}

                  {bismillah ? (
                    <p className="mushaf-basmala">{bismillah}</p>
                  ) : null}

                  <p className="mushaf-ayah-flow text-justify [text-align-last:start]">
                    {segment.ayahs.map((ayah) => {
                      const isSelected =
                        selected?.surahNumber === ayah.surahNumber &&
                        selected?.ayahNumber === ayah.ayahNumber;
                      const inPendingRange =
                        rangeMode != null &&
                        ayah.surahNumber === rangeMode.surahNumber &&
                        ayah.ayahNumber >= rangeStart &&
                        ayah.ayahNumber <= rangeEnd &&
                        (pendingRangeEnd != null ||
                          ayah.ayahNumber === rangeMode.startAyahNumber);
                      const ayahLabel = tQuran("reader.ayahMarker", {
                        number: ayah.ayahNumber,
                      });
                      const favorited = isFavorited(
                        ayah.surahNumber,
                        ayah.ayahNumber,
                      );
                      const memorizing = isCoveredByMemorization(
                        ayah.surahNumber,
                        ayah.ayahNumber,
                      );

                      const rub = rubMarkers.find(
                        (marker) =>
                          marker.surahNumber === ayah.surahNumber &&
                          marker.ayahNumber === ayah.ayahNumber,
                      );

                      const isActiveTrack =
                        activeAyah?.surahNumber === ayah.surahNumber &&
                        activeAyah.ayahNumber === ayah.ayahNumber;

                      return (
                        <span
                          key={`${ayah.surahNumber}:${ayah.ayahNumber}`}
                          id={`ayah-${ayah.surahNumber}-${ayah.ayahNumber}`}
                          className={
                            isActiveTrack ? "mushaf-ayah-active" : undefined
                          }
                        >
                          {rub ? (
                            <RubAlHizbMarker
                              label={tQuran("pageReader.rubMarker", {
                                hizb: rub.hizbNumber,
                                quarter: rub.quarterInHizb,
                              })}
                            />
                          ) : null}
                          {ayah.text}
                          <button
                            type="button"
                            className={cn(
                              "mushaf-ayah-marker-btn",
                              isSelected && "mushaf-ayah-marker-btn--selected",
                              favorited && "mushaf-ayah-marker-btn--saved",
                              memorizing && "mushaf-ayah-marker-btn--memorizing",
                              inPendingRange &&
                                "mushaf-ayah-marker-btn--range",
                            )}
                            aria-label={tFavorites("mushaf.openActions", {
                              number: ayah.ayahNumber,
                            })}
                            aria-pressed={isSelected}
                            title={tFavorites("mushaf.openActions", {
                              number: ayah.ayahNumber,
                            })}
                            onClick={() => selectAyah(ayah)}
                          >
                            <AyahNumber
                              number={ayah.ayahNumber}
                              label={ayahLabel}
                            />
                          </button>
                        </span>
                      );
                    })}
                  </p>
                </section>
              );
            })}
          </div>

          <div
            lang="ar"
            dir="rtl"
            className="mushaf-page-num"
            aria-hidden="true"
          >
            <span className="mushaf-page-num-rule" />
            <span className="mushaf-page-num-diamond" />
            <span className="mushaf-page-num-label">{pageNumberLabel}</span>
            <span className="mushaf-page-num-diamond" />
            <span className="mushaf-page-num-rule" />
          </div>
        </MushafPageFrame>
      </article>

      <div className="mushaf-ayah-chrome" aria-live="polite">
        {rangeMode ? (
          <div className="mushaf-ayah-panel mushaf-ayah-panel--range">
            <div className="min-w-0 flex-1 text-center sm:text-start">
              <p className="text-sm font-medium text-ink">
                {tMemorization("mushaf.rangeActive", {
                  surahName: rangeMode.surahName,
                  start: rangeMode.startAyahNumber,
                })}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {pendingRangeEnd
                  ? tMemorization("mushaf.rangeConfirmHint", {
                      start: rangeStart,
                      end: rangeEnd,
                    })
                  : tMemorization("mushaf.chooseEndAyah")}
              </p>
              {rangeError ? (
                <p role="alert" className="mt-1 text-xs text-red-700">
                  {rangeError}
                </p>
              ) : null}
            </div>

            <div className="mushaf-ayah-actions">
              {pendingRangeEnd ? (
                <MemorizeUnitButton
                  key={`range-${rangeIdentity}`}
                  label={tMemorization("mushaf.confirmRange")}
                  pendingLabel={tMemorization("adding")}
                  alreadyAdded={unitAlreadyAdded(rangeIdentity)}
                  returnPath={ayahReturnPath}
                  payload={{
                    unitType: rangeStart === rangeEnd ? "ayah" : "range",
                    surahNumber: rangeMode.surahNumber,
                    startAyahNumber: rangeStart,
                    endAyahNumber: rangeEnd,
                  }}
                  onAdded={() => {
                    const keys: string[] = [];
                    for (let n = rangeStart; n <= rangeEnd; n += 1) {
                      keys.push(
                        ayahMembershipKey(rangeMode.surahNumber, n),
                      );
                    }
                    markUnitAdded(rangeIdentity, keys);
                    cancelRangeMode();
                    setSelected(null);
                  }}
                />
              ) : null}
              <button
                type="button"
                onClick={cancelRangeMode}
                className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-sage/60 hover:text-ink"
              >
                {tMemorization("mushaf.cancel")}
              </button>
            </div>
          </div>
        ) : selected ? (
          <div className="mushaf-ayah-panel">
            <div className="min-w-0 flex-1 text-center sm:text-start">
              <p className="text-sm font-medium text-ink">
                {tFavorites("mushaf.selected", {
                  surahName: selected.surahName,
                  ayahNumber: selected.ayahNumber,
                })}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {tTafsir("mushaf.actionHint")}
              </p>
            </div>

            <div className="mushaf-ayah-actions">
              <SaveReadingPosition
                key={`progress-${selected.surahNumber}-${selected.ayahNumber}`}
                surahNumber={selected.surahNumber}
                ayahNumber={selected.ayahNumber}
                pageNumber={pageNumber}
                returnPath={ayahReturnPath}
              />
              <FavoriteToggle
                key={favoriteKey(selected.surahNumber, selected.ayahNumber)}
                surahNumber={selected.surahNumber}
                ayahNumber={selected.ayahNumber}
                initialFavorited={isFavorited(
                  selected.surahNumber,
                  selected.ayahNumber,
                )}
                returnPath={ayahReturnPath}
                variant="button"
                onFavoritedChange={(favorited) => {
                  const key = favoriteKey(
                    selected.surahNumber,
                    selected.ayahNumber,
                  );
                  setFavoriteMap((current) => ({
                    ...current,
                    [key]: favorited,
                  }));
                }}
              />
              <TafsirActionButton
                key={`tafsir-${selected.surahNumber}-${selected.ayahNumber}`}
                surahNumber={selected.surahNumber}
                ayahNumber={selected.ayahNumber}
                surahName={selected.surahName}
                ayahText={selected.ayahText}
              />
              <ListenAyahButton
                key={`listen-${selected.surahNumber}-${selected.ayahNumber}`}
                surahNumber={selected.surahNumber}
                ayahNumber={selected.ayahNumber}
              />
              <MemorizeUnitButton
                key={`ayah-${ayahIdentity}`}
                label={tMemorization("mushaf.memorizeAyah")}
                pendingLabel={tMemorization("adding")}
                alreadyAdded={unitAlreadyAdded(ayahIdentity)}
                returnPath={ayahReturnPath}
                payload={{
                  unitType: "ayah",
                  surahNumber: selected.surahNumber,
                  startAyahNumber: selected.ayahNumber,
                  endAyahNumber: selected.ayahNumber,
                }}
                onAdded={() => {
                  markUnitAdded(ayahIdentity, [
                    ayahMembershipKey(
                      selected.surahNumber,
                      selected.ayahNumber,
                    ),
                  ]);
                }}
              />
              <button
                type="button"
                onClick={startRangeSelection}
                className="inline-flex min-h-9 items-center justify-center rounded-xl border border-emerald/20 bg-surface px-3 py-2 text-sm font-semibold text-emerald-deep transition-colors hover:bg-sage/70"
              >
                {tMemorization("mushaf.selectRange")}
              </button>
              {pageFirst && pageLast ? (
                <MemorizeUnitButton
                  key={`page-${pageIdentity}`}
                  label={tMemorization("mushaf.memorizePage")}
                  pendingLabel={tMemorization("adding")}
                  alreadyAdded={unitAlreadyAdded(pageIdentity)}
                  returnPath={returnPath}
                  payload={{
                    unitType: "page",
                    pageNumber,
                    surahNumber: pageFirst.surahNumber,
                    startAyahNumber: pageFirst.ayahNumber,
                    endAyahNumber: pageLast.ayahNumber,
                  }}
                  onAdded={() => {
                    markUnitAdded(
                      pageIdentity,
                      pageAyahs.map((a) =>
                        ayahMembershipKey(a.surahNumber, a.ayahNumber),
                      ),
                    );
                  }}
                />
              ) : null}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-sage/60 hover:text-ink"
              >
                {tFavorites("mushaf.dismiss")}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted/80">
            {tMemorization("mushaf.selectHint")}
          </p>
        )}
      </div>

      <style href="mushaf-ayah-select" precedence="mushaf-ayah-select">{`
        .mushaf-ayah-active {
          background-color: rgba(184, 148, 74, 0.2);
          border-radius: 0.12em;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
          transition: background-color 220ms ease;
        }
        .mushaf-ayah-marker-btn {
          display: inline-flex;
          padding: 0;
          margin: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
          vertical-align: middle;
          border-radius: 999px;
          line-height: 0;
        }
        .mushaf-ayah-marker-btn:focus-visible {
          outline: 2px solid rgba(15, 122, 82, 0.45);
          outline-offset: 2px;
        }
        .mushaf-ayah-marker-btn--selected .ayahNumber {
          filter: drop-shadow(0 0 0.12em rgba(15, 122, 82, 0.45));
        }
        .mushaf-ayah-marker-btn--saved .ayahNumber {
          filter: drop-shadow(0 0 0.1em rgba(183, 146, 62, 0.55));
        }
        .mushaf-ayah-marker-btn--memorizing .ayahNumber {
          filter: drop-shadow(0 0 0.1em rgba(15, 122, 82, 0.4));
        }
        .mushaf-ayah-marker-btn--range .ayahNumber {
          filter: drop-shadow(0 0 0.14em rgba(15, 122, 82, 0.65));
        }
        .mushaf-ayah-chrome {
          flex-shrink: 0;
          width: 100%;
          min-height: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-block: 0.35rem;
        }
        .mushaf-ayah-panel {
          width: min(100%, 52rem);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.75rem 1rem;
          border: 1px solid rgba(15, 122, 82, 0.14);
          border-radius: 1rem;
          background: rgba(250, 248, 242, 0.95);
          padding: 0.75rem 1rem;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset;
        }
        .mushaf-ayah-panel--range {
          border-color: rgba(15, 122, 82, 0.28);
          background: rgba(232, 243, 236, 0.95);
        }
        .mushaf-ayah-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: center;
          gap: 0.5rem;
        }
      `}</style>
    </>
  );
}
