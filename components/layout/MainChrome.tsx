"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Hides the site footer on auth screens so Register can fill the remaining
 * desktop viewport without page scroll. Mobile bottom padding stays so the
 * fixed mobile nav does not cover the form.
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

  return (
    <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      {children}
      {isAuthScreen ? null : footer}
    </div>
  );
}
