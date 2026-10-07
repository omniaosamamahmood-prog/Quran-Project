/** True when the browser reports no network. Safe during SSR (returns false). */
export function isDeviceOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
