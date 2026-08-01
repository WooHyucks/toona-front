import type { Metadata } from "next";
import ResultPageClient from "./ResultPageClient";
import { fetchWebtoonDetailForMeta } from "@/lib/seo/fetch";
import {
  DEFAULT_OG_IMAGE_PATH,
  buildPageMetadata,
} from "@/lib/seo/metadata";

type Props = {
  searchParams: {
    webtoonId?: string;
    title?: string;
  };
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const webtoonId = searchParams.webtoonId?.trim();
  const titleHint = searchParams.title?.trim();

  if (!webtoonId) {
    return buildPageMetadata({
      title: "웹툰과 비슷한 작품 추천 | TOONA",
      description:
        "재밌게 본 웹툰을 고르면 비슷한 작품을 추천해드려요.",
      pathname: "/onboarding/result",
      image: DEFAULT_OG_IMAGE_PATH,
      robots: { index: false, follow: true },
    });
  }

  const detail = await fetchWebtoonDetailForMeta(webtoonId);
  const title = detail?.title || titleHint || "웹툰";
  const image = detail?.thumbnailUrl || DEFAULT_OG_IMAGE_PATH;

  return buildPageMetadata({
    title: `${title}과 비슷한 웹툰 3개 | TOONA`,
    description: `${title}을 재미있게 봤다면 좋아할 만한 웹툰을 확인해보세요.`,
    pathname: `/webtoon/${webtoonId}`,
    image,
    openGraphTitle: `${title} 다음에 볼 웹툰 3개`,
    openGraphDescription: "취향이 비슷한 작품을 TOONA가 골라드려요.",
    // Avoid duplicate indexing with /webtoon/[id]; OG still works for Kakao shares
    robots: { index: false, follow: true },
  });
}

export default function ResultPage() {
  return <ResultPageClient />;
}
