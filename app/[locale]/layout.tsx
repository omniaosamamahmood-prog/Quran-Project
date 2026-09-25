import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/layout/Navbar";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { MainChrome } from "@/components/layout/MainChrome";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  amiriQuran,
  ibmPlexSansArabic,
  notoNaskhArabic,
  sourceSans,
  sourceSerif,
} from "@/app/fonts";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";
import "../globals.css";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const viewport: Viewport = {
  themeColor: "#faf8f2",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("Navigation");
  const direction = locale === "ar" ? "rtl" : "ltr";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const navbarUser = user
    ? {
        fullName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null,
        email: user.email ?? null,
      }
    : null;

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
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-emerald focus:px-3 focus:py-2 focus:text-white"
          >
            {t("skipToContent")}
          </a>
          <Navbar user={navbarUser} />
          <MainChrome footer={<SiteFooter />}>{children}</MainChrome>
          <MobileNavigation />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
