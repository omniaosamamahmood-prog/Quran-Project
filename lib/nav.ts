export const NAV_ITEMS = [
  { href: "/", key: "home" },
  { href: "/quran", key: "quran" },
  { href: "/memorization", key: "memorization" },
  { href: "/favorites", key: "favorites" },
  { href: "/adhkar", key: "adhkar" },
] as const;

export type NavItemKey = (typeof NAV_ITEMS)[number]["key"];

export function isNavActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
