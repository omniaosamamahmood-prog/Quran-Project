"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { AyahNumber } from "@/components/quran/AyahNumber";
import { MushafAyahActionSurface } from "@/components/quran/MushafAyahActionSurface";
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

const AYAH_ACTIONS_HINT_KEY = "quran-companion.ayah-actions-hint-seen";
const hintListeners = new Set<() => void>();

function subscribeAyahHint(onChange: () => void) {
  hintListeners.add(onChange);
  return () => {
    hintListeners.delete(onChange);
  };
}

let ayahHintDismissed = false;

function ayahHintVisible() {
  if (ayahHintDismissed) {
    return false;
  }
  try {
    return window.localStorage.getItem(AYAH_ACTIONS_HINT_KEY) !== "1";
  } catch {
    return true;
  }
}

function hideAyahHint() {
  ayahHintDismissed = true;
  try {
    window.localStorage.setItem(AYAH_ACTIONS_HINT_KEY, "1");
  } catch {
    // The hint stays dismissed for this visit if storage is blocked.
  }
  for (const listener of hintListeners) {
    listener();
  }
}

/**
 * Mushaf leaf interaction:
 * - Tap the ayah text or its medallion → the same actions, in a sheet or a nearby panel
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
  const locale = useLocale();
  const tQuran = useTranslations("Quran");
  const tFavorites = useTranslations("Favorites");
  const tMemorization = useTranslations("Memorization");
  const activeAyah = useActiveQuranAyah();
  const [selected, setSelected] = useState<SelectedAyah | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [anchorOffset, setAnchorOffset] = useState<{ x: number; y: number } | null>(
    null,
  );
  const ayahGesture = useRef<{ x: number; y: number; moved: boolean } | null>(
    null,
  );
  const clearGestureListeners = useRef<(() => void) | null>(null);
  const [rangeMode, setRangeMode] = useState<RangeMode | null>(null);
  const [rangeError, setRangeError] = useState("");
  const [pendingRangeEnd, setPendingRangeEnd] = useState<SelectedAyah | null>(
    null,
  );
  const [selectionPage, setSelectionPage] = useState(pageNumber);
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({});
  const [membershipMap, setMembershipMap] = useState<Record<string, boolean>>(
    {},
  );
  const [unitIdMap, setUnitIdMap] = useState<Record<string, boolean>>({});
  const hintVisible = useSyncExternalStore(
    subscribeAyahHint,
    ayahHintVisible,
    () => true,
  );

  if (selectionPage !== pageNumber) {
    setSelectionPage(pageNumber);
    setSelected(null);
    setAnchor(null);
    setAnchorOffset(null);
    setRangeMode(null);
    setPendingRangeEnd(null);
    setRangeError("");
  }
  const pageAyahs = segments.flatMap((segment) => segment.ayahs);
  const pageFirst = pageAyahs[0];
  const pageLast = pageAyahs[pageAyahs.length - 1];

  useEffect(() => {
    return () => {
      clearGestureListeners.current?.();
    };
  }, []);

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

  function markHintSeen() {
    hideAyahHint();
  }

  function closeActions() {
    setSelected(null);
    setAnchor(null);
    setAnchorOffset(null);
    cancelRangeMode();
  }

  function rememberAyahPointer(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    clearGestureListeners.current?.();
    const startX = event.clientX;
    const startY = event.clientY;
    const gesture = { x: startX, y: startY, moved: false };
    ayahGesture.current = gesture;

    function onMove(moveEvent: PointerEvent) {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (dx * dx + dy * dy > 64) {
        gesture.moved = true;
      }
    }
    function stop() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      clearGestureListeners.current = null;
    }
    clearGestureListeners.current = stop;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  function isTextSelectionGesture(event: {
    clientX: number;
    clientY: number;
    shiftKey: boolean;
  }): boolean {
    const gesture = ayahGesture.current;
    ayahGesture.current = null;
    if (event.shiftKey) {
      return true;
    }
    if (!gesture) {
      return false;
    }
    if (gesture.moved) {
      return true;
    }
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    return dx * dx + dy * dy > 64;
  }

  function selectAyah(
    ayah: QuranPageAyah,
    source: HTMLElement,
    point: { clientX: number; clientY: number },
  ) {
    setRangeError("");
    const host = source.closest<HTMLElement>(".mushaf-ayah-hit") ?? source;
    const rect = host.getBoundingClientRect();
    const hasPoint = point.clientX !== 0 || point.clientY !== 0;
    const offset = hasPoint
      ? {
          x: point.clientX - rect.left,
          y: point.clientY - rect.top,
        }
      : null;

    if (rangeMode) {
      if (ayah.surahNumber !== rangeMode.surahNumber) {
        setRangeError(tMemorization("mushaf.crossSurahError"));
        setPendingRangeEnd(null);
        return;
      }

      setAnchor(host);
      setAnchorOffset(offset);
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
      markHintSeen();
      return;
    }

    setAnchor(host);
    setAnchorOffset(offset);
    setSelected({
      surahNumber: ayah.surahNumber,
      surahName: ayah.surahName,
      ayahNumber: ayah.ayahNumber,
      ayahText: ayah.text,
    });
    markHintSeen();
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
                          className={cn(
                            "mushaf-ayah-hit",
                            isActiveTrack && "mushaf-ayah-active",
                            isSelected && "mushaf-ayah-selected",
                          )}
                          onPointerDown={rememberAyahPointer}
                          onClick={(event) => {
                            const target = event.target;
                            if (
                              target instanceof Element &&
                              target.closest(".mushaf-ayah-marker-btn")
                            ) {
                              return;
                            }
                            if (isTextSelectionGesture(event)) {
                              return;
                            }
                            selectAyah(ayah, event.currentTarget, event);
                          }}
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
                            aria-label={tQuran("pageReader.ayahOptions", {
                              ayah: ayah.ayahNumber,
                              name: ayah.surahName,
                            })}
                            aria-haspopup="dialog"
                            aria-expanded={isSelected}
                            aria-controls={
                              isSelected ? "mushaf-ayah-actions" : undefined
                            }
                            aria-pressed={isSelected}
                            title={tQuran("pageReader.ayahOptions", {
                              ayah: ayah.ayahNumber,
                              name: ayah.surahName,
                            })}
                            onClick={(event) => {
                              event.stopPropagation();
                              selectAyah(ayah, event.currentTarget, event);
                            }}
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

      {hintVisible ? (
        <p
          className={cn(
            "mushaf-ayah-hint",
            locale === "ar" && "font-naskh",
          )}
          data-ayah-hint=""
        >
          {tQuran("pageReader.ayahHint")}
        </p>
      ) : null}

      <MushafAyahActionSurface
        open={selected != null}
        anchor={anchor}
        anchorOffset={anchorOffset}
        title={
          rangeMode
            ? tMemorization("mushaf.rangeActive", {
                surahName: rangeMode.surahName,
                start: rangeMode.startAyahNumber,
              })
            : selected
              ? tQuran("pageReader.ayahIdentity", {
                  name: selected.surahName,
                  ayah: selected.ayahNumber,
                })
              : ""
        }
        closeLabel={tFavorites("mushaf.dismiss")}
        onClose={closeActions}
      >
        {rangeMode ? (
          <>
            <p
              className={cn(
                "mb-3 text-center text-xs text-muted",
                locale === "ar" && "font-naskh",
              )}
            >
              {pendingRangeEnd
                ? tMemorization("mushaf.rangeConfirmHint", {
                    start: rangeStart,
                    end: rangeEnd,
                  })
                : tMemorization("mushaf.chooseEndAyah")}
            </p>
            {rangeError ? (
              <p role="alert" className="mb-3 text-center text-xs text-red-700">
                {rangeError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-center gap-2">
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
                      keys.push(ayahMembershipKey(rangeMode.surahNumber, n));
                    }
                    markUnitAdded(rangeIdentity, keys);
                    cancelRangeMode();
                    setSelected(null);
                    setAnchor(null);
                    setAnchorOffset(null);
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
          </>
        ) : selected ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <ListenAyahButton
              key={`listen-${selected.surahNumber}-${selected.ayahNumber}`}
              surahNumber={selected.surahNumber}
              ayahNumber={selected.ayahNumber}
            />
            <TafsirActionButton
              key={`tafsir-${selected.surahNumber}-${selected.ayahNumber}`}
              surahNumber={selected.surahNumber}
              ayahNumber={selected.ayahNumber}
              surahName={selected.surahName}
              ayahText={selected.ayahText}
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
                  ayahMembershipKey(selected.surahNumber, selected.ayahNumber),
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
          </div>
        ) : null}
      </MushafAyahActionSurface>

      <style href="mushaf-ayah-select" precedence="mushaf-ayah-select">{`
        .mushaf-ayah-hit {
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .mushaf-ayah-selected {
          background-color: rgba(184, 148, 74, 0.14);
          border-radius: 0.12em;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
        }
        .mushaf-ayah-active {
          background-color: rgba(184, 148, 74, 0.2);
          border-radius: 0.12em;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
          transition: background-color 220ms ease;
        }
        .mushaf-ayah-hit.mushaf-ayah-active,
        .mushaf-ayah-hit.mushaf-ayah-active:hover {
          background-color: rgba(184, 148, 74, 0.2);
        }
        @media (hover: hover) and (pointer: fine) {
          .mushaf-ayah-hit:hover {
            background-color: rgba(184, 148, 74, 0.08);
            border-radius: 0.12em;
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
          }
          .mushaf-ayah-hit.mushaf-ayah-selected:hover {
            background-color: rgba(184, 148, 74, 0.16);
          }
        }
        .mushaf-ayah-hint {
          margin: 0.35rem auto 0;
          max-width: 36rem;
          padding-inline: 1rem;
          text-align: center;
          font-size: 0.75rem;
          line-height: 1.6;
          color: #6d746c;
        }
        .mushaf-ayah-marker-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
          vertical-align: middle;
          border-radius: 999px;
          line-height: 0;
        }
        @media (pointer: coarse) {
          .mushaf-ayah-marker-btn::after {
            content: "";
            position: absolute;
            inset: -0.5rem -0.3rem;
          }
        }
        @media (hover: hover) and (pointer: fine) {
          .mushaf-ayah-marker-btn:hover .ayahNumber {
            filter: drop-shadow(0 0 0.16em rgba(15, 122, 82, 0.55));
          }
        }
        .mushaf-ayah-marker-btn:focus-visible {
          outline: 2px solid rgba(15, 122, 82, 0.75);
          outline-offset: 3px;
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
        .mushaf-ayah-marker-btn--selected .ayahNumber,
        .mushaf-ayah-marker-btn--selected:hover .ayahNumber {
          filter: drop-shadow(0 0 0.2em rgba(15, 122, 82, 0.8));
          box-shadow: 0 0 0 2px rgba(184, 148, 74, 0.95);
          border-radius: 999px;
        }
      `}</style>
    </>
  );
}
