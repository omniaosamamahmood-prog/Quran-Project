/* Quran Companion service worker.
   One worker, scope "/". Push listeners are intentionally absent.
   CACHE_VERSION is replaced at build time from .next/BUILD_ID. */

const CACHE_VERSION = "__CACHE_VERSION__";
const CACHE_PREFIX = "quran-companion-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-${CACHE_VERSION}`;
const DOCUMENT_CACHE = `${CACHE_PREFIX}documents-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_PREFIX}static-${CACHE_VERSION}`;
const CURRENT_CACHES = new Set([SHELL_CACHE, DOCUMENT_CACHE, STATIC_CACHE]);
const WARM_BATCH = 8;

const DOCUMENT_PATTERNS = [
  /^\/(ar|en)\/quran$/,
  /^\/(ar|en)\/quran\/\d+$/,
  /^\/(ar|en)\/quran\/page\/\d+$/,
  /^\/(ar|en)\/adhkar$/,
  /^\/(ar|en)\/adhkar\/[a-z0-9-]+$/,
  /^\/(ar|en)\/offline$/,
];

let warmPromise = null;

function isCacheableDocument(pathname) {
  return DOCUMENT_PATTERNS.some((pattern) => pattern.test(pathname));
}

function isStaticAsset(pathname) {
  return pathname.startsWith("/_next/static/") && !pathname.endsWith(".map");
}

function isRscRequest(request, url) {
  if (url.searchParams.has("_rsc")) return true;
  if (request.headers.get("RSC") === "1") return true;
  if (request.headers.get("Next-Router-Prefetch")) return true;
  if (request.headers.get("Next-Router-State-Tree")) return true;
  return false;
}

function localeFromPath(pathname) {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  return "ar";
}

function documentRequest(pathname) {
  return new Request(new URL(pathname, self.location.origin).href, {
    method: "GET",
  });
}

function hasAuthSetCookie(response) {
  const cookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  return cookies.some((cookie) =>
    /sb-|auth-token|access_token|refresh_token|service_role/i.test(cookie),
  );
}

async function withoutSetCookie(response) {
  const headers = new Headers();
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    headers.append(key, value);
  });
  headers.delete("set-cookie");
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function documentIsPublic(response) {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return false;
  if (hasAuthSetCookie(response)) return false;
  const text = await response.clone().text();
  if (
    text.includes("access_token") ||
    text.includes("refresh_token") ||
    text.includes("service_role")
  ) {
    return false;
  }
  return true;
}

async function putDocument(pathname, response) {
  if (!(await documentIsPublic(response))) return;
  const cacheName = pathname.endsWith("/offline") ? SHELL_CACHE : DOCUMENT_CACHE;
  const cache = await caches.open(cacheName);
  await cache.put(documentRequest(pathname), await withoutSetCookie(response));
}

async function matchDocument(pathname) {
  const request = documentRequest(pathname);
  const documents = await caches.open(DOCUMENT_CACHE);
  const shell = await caches.open(SHELL_CACHE);
  return (await documents.match(request)) || (await shell.match(request));
}

async function offlineFallback(pathname) {
  const locale = localeFromPath(pathname);
  const cached = await matchDocument(`/${locale}/offline`);
  if (cached) return cached;
  return new Response("Offline", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function handleNavigation(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    const network = await fetch(request);
    if (
      network.ok &&
      isCacheableDocument(pathname) &&
      (await documentIsPublic(network))
    ) {
      await putDocument(pathname, network.clone());
    }
    return network;
  } catch {
    if (isCacheableDocument(pathname)) {
      const cached = await matchDocument(pathname);
      if (cached) return cached;
    }
    return offlineFallback(pathname);
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const network = await fetch(request);
    if (network.ok && !hasAuthSetCookie(network)) {
      await cache.put(request, await withoutSetCookie(network.clone()));
    }
    return network;
  } catch {
    return new Response("", { status: 504 });
  }
}

async function cachedCount(cache, urls, asDocument) {
  let count = 0;
  for (const pathname of urls) {
    const request = asDocument
      ? documentRequest(pathname)
      : new Request(new URL(pathname, self.location.origin).href);
    if (await cache.match(request)) count += 1;
  }
  return count;
}

async function warmList(cache, urls, asDocument) {
  for (let index = 0; index < urls.length; index += WARM_BATCH) {
    const batch = urls.slice(index, index + WARM_BATCH);
    await Promise.all(
      batch.map(async (pathname) => {
        const request = asDocument ? documentRequest(pathname) : new Request(new URL(pathname, self.location.origin).href);
        if (await cache.match(request)) return;
        try {
          const response = await fetch(request, {
            credentials: "omit",
            cache: "no-store",
          });
          if (!response.ok || hasAuthSetCookie(response)) return;
          if (asDocument) {
            if (!(await documentIsPublic(response))) return;
            await cache.put(request, await withoutSetCookie(response));
            return;
          }
          await cache.put(request, await withoutSetCookie(response));
        } catch {
          // A later visit resumes from URLs that are still missing.
        }
      }),
    );
  }
}

async function warmCaches() {
  const markerCache = await caches.open(SHELL_CACHE);
  const markerRequest = documentRequest("/__quran-companion-precache-complete");
  const marker = await markerCache.match(markerRequest);
  if (marker && (await marker.text()) === CACHE_VERSION) return;

  const manifestResponse = await fetch("/precache-manifest.json", {
    cache: "no-store",
    credentials: "omit",
  });
  if (!manifestResponse.ok) return;
  const manifest = await manifestResponse.json();
  if (manifest.version !== CACHE_VERSION) return;

  const shell = Array.isArray(manifest.shell) ? manifest.shell : [];
  const documents = Array.isArray(manifest.documents) ? manifest.documents : [];
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];

  const safeShell = shell.filter((pathname) => isCacheableDocument(pathname));
  const safeDocuments = documents.filter((pathname) =>
    isCacheableDocument(pathname),
  );
  const safeAssets = assets.filter(
    (pathname) =>
      typeof pathname === "string" &&
      isStaticAsset(pathname) &&
      !pathname.includes(".."),
  );

  const shellCache = await caches.open(SHELL_CACHE);
  const staticCache = await caches.open(STATIC_CACHE);
  const documentCache = await caches.open(DOCUMENT_CACHE);

  await warmList(shellCache, safeShell, true);
  await warmList(staticCache, safeAssets, false);
  await warmList(documentCache, safeDocuments, true);

  const complete =
    (await cachedCount(shellCache, safeShell, true)) === safeShell.length &&
    (await cachedCount(staticCache, safeAssets, false)) === safeAssets.length &&
    (await cachedCount(documentCache, safeDocuments, true)) ===
      safeDocuments.length;
  if (!complete) return;

  await markerCache.put(
    markerRequest,
    new Response(CACHE_VERSION, {
      headers: { "Content-Type": "text/plain" },
    }),
  );

  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: "WARM_DONE", version: CACHE_VERSION });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await warmList(cache, ["/ar/offline", "/en/offline"], true);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.has(key)) {
            return caches.delete(key);
          }
          return undefined;
        }),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "WARM_CACHE") return;
  if (!warmPromise) {
    warmPromise = warmCaches().finally(() => {
      warmPromise = null;
    });
  }
  event.waitUntil(warmPromise);
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isRscRequest(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStatic(request));
  }
});
