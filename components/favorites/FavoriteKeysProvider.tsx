"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadSessionFavoriteKeys } from "@/components/favorites/session-favorites";

type FavoriteKeyState = {
  keys: ReadonlySet<string>;
  setKey: (key: string, favorited: boolean) => void;
};

const FavoriteKeysContext = createContext<FavoriteKeyState | null>(null);

export function useFavoriteKeys(): FavoriteKeyState | null {
  return useContext(FavoriteKeysContext);
}

/**
 * Loads favorite keys after hydration so the server HTML stays anonymous.
 * Starts empty for every visitor.
 */
export function FavoriteKeysProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;

    void loadSessionFavoriteKeys().then((next) => {
      if (!cancelled) {
        setKeys(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<FavoriteKeyState>(
    () => ({
      keys,
      setKey(key, favorited) {
        setKeys((current) => {
          const next = new Set(current);
          if (favorited) {
            next.add(key);
          } else {
            next.delete(key);
          }
          return next;
        });
      },
    }),
    [keys],
  );

  return (
    <FavoriteKeysContext.Provider value={value}>
      {children}
    </FavoriteKeysContext.Provider>
  );
}
