import type { Metadata } from "next";
import WorldCupPageClient from "./WorldCupPageClient";
import {
  WORLD_CUP_OG_IMAGE_PATH,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "이번 주말 정주행 웹툰 월드컵 | TOONA",
  description:
    "유명 웹툰 16강에서 더 재밌게 본 작품을 골라보세요. 마지막 작품과 비슷한 웹툰도 찾아드려요.",
  pathname: "/world-cup",
  image: WORLD_CUP_OG_IMAGE_PATH,
  openGraphTitle: "이번 주말 뭐 보지? 웹툰 정주행 월드컵",
  openGraphDescription:
    "유명 웹툰 16강을 끝내면 이번 주말 볼 작품을 추천해드려요.",
  robots: { index: true, follow: true },
});

export default function WorldCupPage() {
  return <WorldCupPageClient />;
}
