import type { Metadata } from "next";
import { RecommendationResultClient } from "@/features/recommendations/RecommendationResultClient";
import { fetchWebtoonDetailForMeta } from "@/lib/seo/fetch";
import {
  DEFAULT_OG_IMAGE_PATH,
  buildPageMetadata,
} from "@/lib/seo/metadata";

type Props = {
  params: { webtoonId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const webtoonId = params.webtoonId?.trim();

  if (!webtoonId) {
    return buildPageMetadata({
      title: "비슷한 웹툰 추천 | TOONA",
      description:
        "재밌게 본 웹툰 하나를 고르면 비슷한 작품을 추천해드려요.",
      pathname: "/recommendations",
      image: DEFAULT_OG_IMAGE_PATH,
      robots: { index: true, follow: true },
    });
  }

  const detail = await fetchWebtoonDetailForMeta(webtoonId);
  if (!detail) {
    return buildPageMetadata({
      title: "비슷한 웹툰 추천 | TOONA",
      description:
        "재밌게 본 웹툰 하나를 고르면 비슷한 작품을 추천해드려요.",
      pathname: `/recommendations/${webtoonId}`,
      image: DEFAULT_OG_IMAGE_PATH,
      robots: { index: true, follow: true },
    });
  }

  const title = detail.title;
  return buildPageMetadata({
    title: `${title}과 비슷한 웹툰 추천 | TOONA`,
    description: `${title}을 재미있게 봤다면 좋아할 만한 웹툰을 확인해보세요.`,
    pathname: `/recommendations/${webtoonId}`,
    image: DEFAULT_OG_IMAGE_PATH,
    openGraphTitle: `${title} 다음에 볼 웹툰 3개`,
    openGraphDescription: `${title}과 취향이 비슷한 작품을 TOONA가 골라드려요.`,
    robots: { index: true, follow: true },
  });
}

export default function RecommendationByIdPage({ params }: Props) {
  return <RecommendationResultClient webtoonId={params.webtoonId} />;
}
