/**
 * Builds the offline manifest from the production prerender and Next static
 * output. Lists URLs only. Does not read or rewrite Quran or Adhkar text.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const appDir = join(root, ".next", "server", "app");
const staticDir = join(root, ".next", "static");

const DOCUMENT_PATTERNS = [
  /^\/(ar|en)\/quran$/,
  /^\/(ar|en)\/quran\/\d+$/,
  /^\/(ar|en)\/quran\/page\/\d+$/,
  /^\/(ar|en)\/adhkar$/,
  /^\/(ar|en)\/adhkar\/[a-z0-9-]+$/,
  /^\/(ar|en)\/offline$/,
];

const DENIED = [
  /^\/(ar|en)$/,
  /^\/(ar|en)\/(login|register|favorites|memorization|review|listen)(\/|$)/,
  /^\/auth\//,
  /^\/api\//,
];

function isCacheableDocument(pathname) {
  if (DENIED.some((pattern) => pattern.test(pathname))) return false;
  return DOCUMENT_PATTERNS.some((pattern) => pattern.test(pathname));
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.endsWith(".segments")) continue;
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function routeFromHtml(file) {
  let route = relative(appDir, file).replaceAll("\\", "/");
  if (!route.endsWith(".html")) return null;
  route = route.slice(0, -".html".length);
  if (route.endsWith("/index")) {
    route = route.slice(0, -"/index".length);
  }
  return `/${route}`;
}

const buildId = (await readFile(join(root, ".next", "BUILD_ID"), "utf8")).trim();
if (!/^[A-Za-z0-9_-]+$/.test(buildId)) {
  throw new Error(`Refusing to embed unexpected build id: ${buildId}`);
}

const htmlFiles = (await walk(appDir)).filter((file) => file.endsWith(".html"));
const shell = [];
const documents = [];
const forbidden = ["access_token", "refresh_token", "service_role"];

for (const file of htmlFiles) {
  const route = routeFromHtml(file);
  if (!route || !isCacheableDocument(route)) continue;
  const html = await readFile(file, "utf8");
  for (const needle of forbidden) {
    if (html.includes(needle)) {
      throw new Error(`${route} contains ${needle} and cannot be precached`);
    }
  }
  if (route.endsWith("/offline")) shell.push(route);
  else documents.push(route);
}

shell.sort();
documents.sort();

if (shell.length !== 2) {
  throw new Error(`Expected /ar/offline and /en/offline, found ${shell.join(", ")}`);
}
if (documents.length < 1700) {
  throw new Error(`Expected the public Quran and Adhkar routes, found ${documents.length}`);
}

const staticFiles = (await walk(staticDir)).filter(
  (file) => !file.endsWith(".map") && !file.endsWith(".txt"),
);
const assets = staticFiles
  .map((file) => {
    const relativePath = relative(staticDir, file).replaceAll("\\", "/");
    return `/_next/static/${relativePath}`;
  })
  .filter((pathname) => pathname.startsWith("/_next/static/") && !pathname.includes(".."))
  .sort();

if (assets.length === 0) {
  throw new Error("No Next static assets were found to precache");
}

const manifest = {
  version: buildId,
  shell,
  documents,
  assets,
};

await writeFile(
  join(root, "public", "precache-manifest.json"),
  JSON.stringify(manifest),
);

const template = await readFile(join(root, "pwa", "sw-template.js"), "utf8");
if (!template.includes("__CACHE_VERSION__")) {
  throw new Error("Service worker template is missing __CACHE_VERSION__");
}
const worker = template.replaceAll("__CACHE_VERSION__", buildId);
await writeFile(join(root, "public", "sw.js"), worker);

console.log(
  `PWA manifest ${buildId}: ${documents.length} documents, ${shell.length} offline pages, ${assets.length} static assets`,
);
