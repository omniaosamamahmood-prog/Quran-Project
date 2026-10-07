import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/layout/Navbar";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { MainChrome } from "@/components/layout/MainChrome";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";
import { PwaRuntime } from "@/components/pwa/PwaRuntime";
import {
  amiriQuran,
  ibmPlexSansArabic,
  notoNaskhArabic,
  sourceSans,
  sourceSerif,
} from "@/app/fonts";
import { cn } from "@/lib/cn";
import "../globals.css";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const viewport: Viewport = {
  themeColor: "#faf8f2",
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (hasLocale(routing.locales, locale)) {
    setRequestLocale(locale);
  }
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
    manifest:
      locale === "en" ? "/manifest-en.webmanifest" : "/manifest-ar.webmanifest",
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        {
          url: "/icons/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Navigation");
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={direction}
      className={cn(
        ibmPlexSansArabic.variable,
        notoNaskhArabic.variable,
        amiriQuran.variable,
        sourceSans.variable,
        sourceSerif.variable,
        "h-full antialiased",
      )}
    >
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <AudioProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-emerald focus:px-3 focus:py-2 focus:text-white"
            >
              {t("skipToContent")}
            </a>
            <PwaRuntime />
            <Navbar />
            <MainChrome footer={<SiteFooter />}>{children}</MainChrome>
            <GlobalAudioPlayer />
            <MobileNavigation />
          </AudioProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
