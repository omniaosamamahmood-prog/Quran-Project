"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallMode = "hidden" | "native" | "ios";

type InstallSnapshot = {
  mode: InstallMode;
  instructionsOpen: boolean;
};

const hiddenSnapshot: InstallSnapshot = {
  mode: "hidden",
  instructionsOpen: false,
};

let snapshot: InstallSnapshot = hiddenSnapshot;
let promptEvent: BeforeInstallPromptEvent | null = null;
let dismissedThisSession = false;
let installed = false;
let iosEligible = false;
let listening = false;
const subscribers = new Set<() => void>();

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;
  return displayStandalone || iosStandalone;
}

function detectIos(): boolean {
  const ua = window.navigator.userAgent;
  const appleMobile = /iPad|iPhone|iPod/.test(ua);
  const iPadOs =
    window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1;
  return appleMobile || iPadOs;
}

function publish() {
  const standalone = isStandalone();
  let mode: InstallMode = "hidden";
  if (!standalone && !installed && !dismissedThisSession) {
    if (promptEvent) mode = "native";
    else if (iosEligible) mode = "ios";
  }
  const next: InstallSnapshot = {
    mode,
    instructionsOpen: mode === "ios" && snapshot.instructionsOpen,
  };
  if (
    next.mode === snapshot.mode &&
    next.instructionsOpen === snapshot.instructionsOpen
  ) {
    return;
  }
  snapshot = next;
  subscribers.forEach((notify) => notify());
}

function ensureListeners() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  iosEligible = detectIos();
  installed = isStandalone();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    if (dismissedThisSession || isStandalone()) return;
    promptEvent = event as BeforeInstallPromptEvent;
    publish();
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    promptEvent = null;
    snapshot = { ...snapshot, instructionsOpen: false };
    publish();
  });

  window
    .matchMedia("(display-mode: standalone)")
    .addEventListener("change", () => {
      publish();
    });

  publish();
}

if (typeof window !== "undefined") {
  ensureListeners();
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  ensureListeners();
  return () => {
    subscribers.delete(notify);
  };
}

function useInstallSnapshot(): InstallSnapshot {
  return useSyncExternalStore(subscribe, () => snapshot, () => hiddenSnapshot);
}

async function promptInstall() {
  const event = promptEvent;
  promptEvent = null;
  if (!event) {
    publish();
    return;
  }
  try {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "dismissed") {
      dismissedThisSession = true;
    }
    if (choice.outcome === "accepted") {
      installed = true;
    }
  } catch {
    dismissedThisSession = false;
  }
  publish();
}

function openInstructions() {
  snapshot = { ...snapshot, instructionsOpen: true };
  subscribers.forEach((notify) => notify());
}

function closeInstructions() {
  snapshot = { ...snapshot, instructionsOpen: false };
  subscribers.forEach((notify) => notify());
}

function InstallButton({ className }: { className?: string }) {
  const t = useTranslations("Install");
  const locale = useLocale();
  const { mode } = useInstallSnapshot();

  return (
    <button
      type="button"
      data-install-action={mode}
      onClick={() => {
        if (snapshot.mode === "native") void promptInstall();
        else if (snapshot.mode === "ios") openInstructions();
      }}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-full border border-emerald/25 bg-sage px-3.5 text-sm font-medium text-emerald-deep transition-colors hover:bg-sage-deep",
        locale === "ar" && "font-naskh",
        className,
      )}
    >
      {t("action")}
    </button>
  );
}

export function InstallNavbarButton() {
  const { mode } = useInstallSnapshot();
  if (mode === "hidden") return null;

  return (
    <div className="hidden lg:block">
      <InstallButton />
    </div>
  );
}

export function InstallMobileBar() {
  const { mode } = useInstallSnapshot();
  if (mode === "hidden") return null;

  return (
    <div className="border-t border-line bg-sage/45 px-4 py-2 lg:hidden">
      <InstallButton className="w-full" />
    </div>
  );
}

export function InstallInstructionsDialog() {
  const t = useTranslations("Install");
  const locale = useLocale();
  const { instructionsOpen } = useInstallSnapshot();

  useEffect(() => {
    if (!instructionsOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeInstructions();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [instructionsOpen]);

  if (!instructionsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/35 p-4 sm:items-center"
      onClick={closeInstructions}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-instructions-title"
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <p
          id="install-instructions-title"
          className={cn(
            "whitespace-pre-line text-sm leading-relaxed text-ink",
            locale === "ar" && "font-naskh text-base leading-loose",
          )}
        >
          {t("iosInstructions")}
        </p>
        <button
          type="button"
          onClick={closeInstructions}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-emerald text-sm font-semibold text-white transition-colors hover:bg-emerald-deep"
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
}
