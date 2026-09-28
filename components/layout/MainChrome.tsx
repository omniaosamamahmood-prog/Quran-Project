"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { useQuranAudio } from "@/components/audio/AudioProvider";
import { cn } from "@/lib/cn";

/**
 * Hides the site footer on auth screens so Register can fill the remaining
 * desktop viewport without page scroll. Mobile bottom padding stays so the
 * fixed mobile nav does not cover the form. Extra padding when the global
 * audio player is visible.
 */
export function MainChrome({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const isAuthScreen = pathname === "/register" || pathname === "/login";
  const { isPlayerVisible } = useQuranAudio();

  return (
    <div
      className={cn(
        "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0",
        isPlayerVisible &&
          "pb-[calc(9.75rem+env(safe-area-inset-bottom))] lg:pb-28",
      )}
    >
      {children}
      {isAuthScreen ? null : footer}
    </div>
  );
}
