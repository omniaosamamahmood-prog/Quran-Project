import { setRequestLocale } from "next-intl/server";
import { AdhkarHome } from "@/components/adhkar/AdhkarHome";

export default async function AdhkarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdhkarHome />;
}
