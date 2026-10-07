"use client";

import { useEffect } from "react";
import { isDeviceOffline } from "@/lib/pwa/offline";

/**
 * Registers the single root service worker and, while offline, turns
 * same-origin link clicks into full document loads. Full loads are served
 * from the cached HTML. Unstable Next.js RSC query URLs are not stored.
 */
export function PwaRuntime() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    function ping(worker: ServiceWorker | null) {
      worker?.postMessage({ type: "WARM_CACHE" });
    }

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        if (cancelled) return;
        ping(registration.active);
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          installing?.addEventListener("statechange", () => {
            if (installing.state === "activated") {
              ping(installing);
            }
          });
        });
      })
      .catch(() => {
        // Registration is unavailable in this browser context.
      });

    function onControllerChange() {
      ping(navigator.serviceWorker.controller);
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!isDeviceOffline()) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.href;
      if (!href) return;
      let url: URL;
      try {
        url = new URL(href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      window.location.assign(url.href);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
