"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_RECITER_ID,
  V1_RECITERS,
  type AyahAudioPayload,
} from "@/types/quran-audio";
import {
  consumeRepeatPlay,
  createRepeatSession,
  repeatOnEnded,
  type RepeatSession,
} from "@/lib/audio-repeat";
import { isDeviceOffline } from "@/lib/pwa/offline";

const RECITER_STORAGE_KEY = "quran-companion.reciterId";

type PlaybackStatus =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "error";

type AdjacentInfo = {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  ayahText: string;
} | null;

type AudioContextValue = {
  status: PlaybackStatus;
  track: AyahAudioPayload | null;
  reciterId: string;
  currentTime: number;
  duration: number;
  volume: number;
  errorMessage: string | null;
  hasPrevious: boolean;
  hasNext: boolean;
  isPlayerVisible: boolean;
  playAyah: (input: {
    surahNumber: number;
    ayahNumber: number;
    autoplay?: boolean;
    /** Bounded replay of this ayah. Omit for normal continuous playback. */
    repeatCount?: number;
  }) => Promise<void>;
  togglePlayPause: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setReciterId: (reciterId: string) => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  retry: () => Promise<void>;
  dismiss: () => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

/** Surah + ayah of the loaded track. Null when the player has no track. */
export type ActiveQuranAyah = {
  surahNumber: number;
  ayahNumber: number;
};

const ActiveAyahContext = createContext<ActiveQuranAyah | null>(null);

async function fetchAdjacent(
  surahNumber: number,
  ayahNumber: number,
  direction: "next" | "previous",
): Promise<AdjacentInfo> {
  const response = await fetch(
    `/api/quran/audio/adjacent?surah=${surahNumber}&ayah=${ayahNumber}&direction=${direction}`,
  );
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as AdjacentInfo;
}

async function fetchAudio(
  surahNumber: number,
  ayahNumber: number,
  reciterId: string,
): Promise<
  | { ok: true; data: AyahAudioPayload }
  | { ok: false; reason: "offline" | "unavailable" }
> {
  if (isDeviceOffline()) {
    return { ok: false, reason: "offline" };
  }

  try {
    const response = await fetch(
      `/api/quran/audio?surah=${surahNumber}&ayah=${ayahNumber}&reciter=${encodeURIComponent(reciterId)}`,
    );
    if (!response.ok) {
      return { ok: false, reason: "unavailable" };
    }
    const data = (await response.json()) as AyahAudioPayload;
    if (!data.audioUrl) {
      return { ok: false, reason: "unavailable" };
    }
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      reason: isDeviceOffline() ? "offline" : "unavailable",
    };
  }
}

function readStoredReciter(): string {
  if (typeof window === "undefined") {
    return DEFAULT_RECITER_ID;
  }
  try {
    const stored = window.localStorage.getItem(RECITER_STORAGE_KEY);
    if (stored && V1_RECITERS.some((reciter) => reciter.id === stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return DEFAULT_RECITER_ID;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestIdRef = useRef(0);
  const trackRef = useRef<AyahAudioPayload | null>(null);
  const reciterIdRef = useRef(DEFAULT_RECITER_ID);
  /** True only after the user has explicitly started playback this session. */
  const continuousEnabledRef = useRef(false);
  /** Guards against duplicate `ended` → next-ayah races. */
  const advancingRef = useRef(false);
  /** Finite replay of one ayah started from memorization. Null for normal playback. */
  const repeatSessionRef = useRef<RepeatSession | null>(null);
  const loadAndMaybePlayRef = useRef<
    | ((
        surahNumber: number,
        ayahNumber: number,
        selectedReciterId: string,
        autoplay: boolean,
      ) => Promise<void>)
    | null
  >(null);

  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [track, setTrack] = useState<AyahAudioPayload | null>(null);
  const [reciterId, setReciterIdState] = useState(DEFAULT_RECITER_ID);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  if (typeof window !== "undefined" && !storageReady) {
    setReciterIdState(readStoredReciter());
    setStorageReady(true);
  }

  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  useEffect(() => {
    reciterIdRef.current = reciterId;
  }, [reciterId]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onLoaded = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onPlay = () => setStatus("playing");
    const onPause = () => {
      if (advancingRef.current || audio.ended) return;
      setStatus((current) => (current === "loading" ? current : "paused"));
    };
    const onEnded = () => {
      setCurrentTime(0);

      if (advancingRef.current) {
        return;
      }

      const current = trackRef.current;
      const session = repeatSessionRef.current;
      const repeatAction = repeatOnEnded(session, current);

      if (repeatAction === "replay" && session) {
        advancingRef.current = true;
        repeatSessionRef.current = consumeRepeatPlay(session);
        const audioElement = audioRef.current;
        if (!audioElement) {
          advancingRef.current = false;
          repeatSessionRef.current = null;
          setStatus("paused");
          return;
        }
        audioElement.currentTime = 0;
        void audioElement
          .play()
          .then(() => {
            advancingRef.current = false;
          })
          .catch(() => {
            advancingRef.current = false;
            repeatSessionRef.current = null;
            setStatus("error");
            setErrorMessage(isDeviceOffline() ? "offline" : "unavailable");
          });
        return;
      }

      if (repeatAction === "stop") {
        repeatSessionRef.current = null;
        continuousEnabledRef.current = false;
        setStatus("paused");
        return;
      }

      if (!continuousEnabledRef.current) {
        setStatus("paused");
        return;
      }

      if (!current) {
        setStatus("paused");
        return;
      }

      advancingRef.current = true;
      setStatus("loading");

      void (async () => {
        try {
          const adjacent = await fetchAdjacent(
            current.surahNumber,
            current.ayahNumber,
            "next",
          );

          // Final ayah of the Quran (e.g. 114:6) — stop normally, no wrap.
          if (!adjacent) {
            setStatus("paused");
            return;
          }

          const load = loadAndMaybePlayRef.current;
          if (!load) {
            setStatus("error");
            setErrorMessage(isDeviceOffline() ? "offline" : "unavailable");
            return;
          }

          await load(
            adjacent.surahNumber,
            adjacent.ayahNumber,
            reciterIdRef.current,
            true,
          );
        } catch {
          setStatus("error");
          setErrorMessage(isDeviceOffline() ? "offline" : "unavailable");
        } finally {
          advancingRef.current = false;
        }
      })();
    };
    const onError = () => {
      setStatus("error");
      setErrorMessage(isDeviceOffline() ? "offline" : "unavailable");
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, []);

  const refreshAdjacent = useCallback(
    async (surahNumber: number, ayahNumber: number) => {
      const [prev, next] = await Promise.all([
        fetchAdjacent(surahNumber, ayahNumber, "previous"),
        fetchAdjacent(surahNumber, ayahNumber, "next"),
      ]);
      setHasPrevious(Boolean(prev));
      setHasNext(Boolean(next));
    },
    [],
  );

  const loadAndMaybePlay = useCallback(
    async (
      surahNumber: number,
      ayahNumber: number,
      selectedReciterId: string,
      autoplay: boolean,
    ) => {
      const audio = audioRef.current;
      if (!audio) return;

      const requestId = ++requestIdRef.current;
      setStatus("loading");
      setErrorMessage(null);
      audio.pause();

      const result = await fetchAudio(
        surahNumber,
        ayahNumber,
        selectedReciterId,
      );
      if (requestId !== requestIdRef.current) return;

      if (!result.ok) {
        repeatSessionRef.current = null;
        setStatus("error");
        setErrorMessage(result.reason);
        return;
      }

      setTrack(result.data);
      trackRef.current = result.data;
      void refreshAdjacent(result.data.surahNumber, result.data.ayahNumber);

      audio.src = result.data.audioUrl;
      audio.load();
      setCurrentTime(0);

      if (autoplay) {
        try {
          await audio.play();
          if (requestId === requestIdRef.current) {
            setStatus("playing");
          }
        } catch {
          if (requestId === requestIdRef.current) {
            setStatus("ready");
          }
        }
      } else {
        setStatus("ready");
      }
    },
    [refreshAdjacent],
  );

  useEffect(() => {
    loadAndMaybePlayRef.current = loadAndMaybePlay;
  }, [loadAndMaybePlay]);

  const playAyah = useCallback(
    async (input: {
      surahNumber: number;
      ayahNumber: number;
      autoplay?: boolean;
      repeatCount?: number;
    }) => {
      const session =
        input.repeatCount == null
          ? null
          : createRepeatSession(
              input.surahNumber,
              input.ayahNumber,
              input.repeatCount,
            );
      if (session) {
        repeatSessionRef.current = session;
        continuousEnabledRef.current = false;
      } else {
        repeatSessionRef.current = null;
        if (input.autoplay !== false) {
          continuousEnabledRef.current = true;
        }
      }
      await loadAndMaybePlay(
        input.surahNumber,
        input.ayahNumber,
        reciterId,
        input.autoplay !== false,
      );
    },
    [loadAndMaybePlay, reciterId],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    if (!repeatSessionRef.current) {
      continuousEnabledRef.current = true;
    }
    void audioRef.current?.play().catch(() => {
      setStatus("error");
      setErrorMessage(isDeviceOffline() ? "offline" : "unavailable");
    });
  }, []);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.paused) {
      resume();
    } else {
      pause();
    }
  }, [pause, resume, track]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || seconds));
    setCurrentTime(audio.currentTime);
  }, []);

  const setVolume = useCallback((value: number) => {
    const next = Math.max(0, Math.min(1, value));
    setVolumeState(next);
    if (audioRef.current) {
      audioRef.current.volume = next;
    }
  }, []);

  const setReciterId = useCallback(
    (nextId: string) => {
      if (!V1_RECITERS.some((reciter) => reciter.id === nextId)) {
        return;
      }
      setReciterIdState(nextId);
      reciterIdRef.current = nextId;
      try {
        window.localStorage.setItem(RECITER_STORAGE_KEY, nextId);
      } catch {
        // ignore
      }
      if (track) {
        repeatSessionRef.current = null;
        void loadAndMaybePlay(
          track.surahNumber,
          track.ayahNumber,
          nextId,
          status === "playing",
        );
      }
    },
    [loadAndMaybePlay, status, track],
  );

  const playNext = useCallback(async () => {
    if (!track) return;
    repeatSessionRef.current = null;
    continuousEnabledRef.current = true;
    audioRef.current?.pause();
    const adjacent = await fetchAdjacent(
      track.surahNumber,
      track.ayahNumber,
      "next",
    );
    if (!adjacent) return;
    await loadAndMaybePlay(
      adjacent.surahNumber,
      adjacent.ayahNumber,
      reciterId,
      true,
    );
  }, [loadAndMaybePlay, reciterId, track]);

  const playPrevious = useCallback(async () => {
    if (!track) return;
    repeatSessionRef.current = null;
    continuousEnabledRef.current = true;
    audioRef.current?.pause();
    const adjacent = await fetchAdjacent(
      track.surahNumber,
      track.ayahNumber,
      "previous",
    );
    if (!adjacent) return;
    await loadAndMaybePlay(
      adjacent.surahNumber,
      adjacent.ayahNumber,
      reciterId,
      true,
    );
  }, [loadAndMaybePlay, reciterId, track]);

  const retry = useCallback(async () => {
    if (!track) return;
    repeatSessionRef.current = null;
    continuousEnabledRef.current = true;
    await loadAndMaybePlay(
      track.surahNumber,
      track.ayahNumber,
      reciterId,
      true,
    );
  }, [loadAndMaybePlay, reciterId, track]);

  const dismiss = useCallback(() => {
    requestIdRef.current += 1;
    continuousEnabledRef.current = false;
    advancingRef.current = false;
    repeatSessionRef.current = null;
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    setTrack(null);
    trackRef.current = null;
    setStatus("idle");
    setCurrentTime(0);
    setDuration(0);
    setErrorMessage(null);
    setHasNext(false);
    setHasPrevious(false);
  }, []);

  const value = useMemo<AudioContextValue>(
    () => ({
      status,
      track,
      reciterId: storageReady ? reciterId : DEFAULT_RECITER_ID,
      currentTime,
      duration,
      volume,
      errorMessage,
      hasPrevious,
      hasNext,
      isPlayerVisible: Boolean(track) || status === "loading" || status === "error",
      playAyah,
      togglePlayPause,
      pause,
      resume,
      seek,
      setVolume,
      setReciterId,
      playNext,
      playPrevious,
      retry,
      dismiss,
    }),
    [
      status,
      track,
      reciterId,
      storageReady,
      currentTime,
      duration,
      volume,
      errorMessage,
      hasPrevious,
      hasNext,
      playAyah,
      togglePlayPause,
      pause,
      resume,
      seek,
      setVolume,
      setReciterId,
      playNext,
      playPrevious,
      retry,
      dismiss,
    ],
  );

  const activeAyah = useMemo<ActiveQuranAyah | null>(() => {
    if (!track) return null;
    return {
      surahNumber: track.surahNumber,
      ayahNumber: track.ayahNumber,
    };
  }, [track]);

  return (
    <AudioContext.Provider value={value}>
      <ActiveAyahContext.Provider value={activeAyah}>
        {children}
      </ActiveAyahContext.Provider>
    </AudioContext.Provider>
  );
}

/** Loaded Quran ayah, or null after the player is closed. Same track state as useQuranAudio. */
export function useActiveQuranAyah(): ActiveQuranAyah | null {
  return useContext(ActiveAyahContext);
}

export function useQuranAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useQuranAudio must be used within AudioProvider");
  }
  return context;
}
