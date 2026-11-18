import type { Metadata } from "next";
import { HomeClient } from "@/features/home/HomeClient";
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
    title: dict.seo.defaultTitle,
    description: dict.seo.defaultDescription,
    pathname: "/home",
    image: DEFAULT_OG_IMAGE_PATH,
    openGraphTitle: dict.seo.homeOgTitle,
    openGraphDescription: dict.seo.defaultDescription,
    robots: { index: true, follow: true },
  });
}

export default function HomePage() {
  return <HomeClient />;
}
