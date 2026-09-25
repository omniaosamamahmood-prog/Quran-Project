import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";

export async function SiteFooter() {
  const t = await getTranslations("Footer");

  return (
    <footer className="pb-8 pt-4 lg:pb-12">
      <Container className="flex flex-col items-center gap-3">
        <div aria-hidden className="flex w-full max-w-md items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-l from-gold/45 to-transparent" />
          <svg viewBox="0 0 16 16" className="h-3 w-3 text-gold/80" fill="none">
            <path
              d="M8 1.5 9 6.2 13.5 5 10.6 8 13.5 11 9 9.8 8 14.5 7 9.8 2.5 11 5.4 8 2.5 5 7 6.2Z"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
          </svg>
          <span className="h-px flex-1 bg-gradient-to-r from-gold/45 to-transparent" />
        </div>
        <p className="text-center text-xs text-muted">{t("note")}</p>
      </Container>
    </footer>
  );
}
