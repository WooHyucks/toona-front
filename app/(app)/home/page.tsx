import type { Metadata } from "next";
import { HomeClient } from "@/features/home/HomeClient";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TITLE,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  pathname: "/home",
  image: DEFAULT_OG_IMAGE_PATH,
  openGraphTitle: "재밌게 본 웹툰 하나만 골라보세요 | TOONA",
  openGraphDescription: "좋아했던 작품과 비슷한 웹툰을 바로 찾아드려요.",
  robots: { index: true, follow: true },
});

export default function HomePage() {
  return <HomeClient />;
}
