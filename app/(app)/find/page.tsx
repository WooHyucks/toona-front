import type { Metadata } from "next";
import { FindScreen } from "@/features/find/FindScreen";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";
import {
  DEFAULT_OG_IMAGE_PATH,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);
  return buildPageMetadata({
    title: dict.seo.findTitle,
    description: dict.seo.findDescription,
    pathname: "/find",
    image: DEFAULT_OG_IMAGE_PATH,
    openGraphTitle: dict.seo.findTitle,
    openGraphDescription: dict.seo.findDescription,
    robots: { index: true, follow: true },
  });
}

export default function FindPage() {
  return <FindScreen />;
}
