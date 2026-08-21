import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { Badge } from "@/components/ui/badge";
import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import { StartSimilarAnalysisButton } from "@/features/webtoons/components/StartSimilarAnalysisButton";
import { OpenWebtoonButton } from "@/features/webtoons/components/OpenWebtoonButton";
import { getWebtoonById } from "@/lib/webtoons";
import {
  DAY_LABEL,
  GENRE_LABELS,
  STATUS_LABELS,
  type DayOfWeek,
} from "@/features/webtoons/model";
import { fetchWebtoonDetailForMeta } from "@/lib/seo/fetch";
import {
  DEFAULT_OG_IMAGE_PATH,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await fetchWebtoonDetailForMeta(params.id);
  if (!detail) {
    return buildPageMetadata({
      title: "웹툰과 비슷한 작품 추천 | TOONA",
      description:
        "재밌게 본 웹툰을 고르면 비슷한 작품을 추천해드려요.",
      pathname: `/webtoon/${params.id}`,
      image: DEFAULT_OG_IMAGE_PATH,
      robots: { index: true, follow: true },
    });
  }

  const title = detail.title;
  return buildPageMetadata({
    title: `${title} 좋아한다면? 비슷한 웹툰 추천 | TOONA`,
    description: `${title}의 취향 포인트를 분석하고 비슷한 웹툰을 추천해드려요.`,
    pathname: `/webtoon/${detail.id}`,
    image: detail.thumbnailUrl || DEFAULT_OG_IMAGE_PATH,
    openGraphTitle: `${title}과 비슷한 웹툰`,
    openGraphDescription: `${title}을 재미있게 봤다면 좋아할 만한 다음 작품을 확인해보세요.`,
    robots: { index: true, follow: true },
  });
}

export default async function WebtoonDetailPage({ params }: Props) {
  const webtoon = await getWebtoonById(params.id);
  if (!webtoon) notFound();

  const primaryDay = webtoon.primaryDay as DayOfWeek | null;
  const dayLabel = primaryDay ? DAY_LABEL[primaryDay] : null;
  const genreLabel = webtoon.primaryGenre
    ? GENRE_LABELS[webtoon.primaryGenre]
    : null;
  const statusLabel = webtoon.status ? STATUS_LABELS[webtoon.status] : null;

  return (
    <main className="min-h-[100dvh] bg-background pb-10">
      <AppHeader showSearch />
      <div className="mx-auto max-w-app px-4 py-6 sm:max-w-content sm:px-6">
        <div className="mx-auto aspect-[2/3] max-w-[280px] overflow-hidden rounded-[18px] bg-muted">
          {webtoon.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={webtoon.thumbnailUrl}
              alt={webtoon.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={webtoon.platform} size="sm" />
            {genreLabel ? <Badge variant="secondary">{genreLabel}</Badge> : null}
            {statusLabel ? <Badge variant="secondary">{statusLabel}</Badge> : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{webtoon.title}</h1>
          <p className="text-[15px] text-muted-foreground">
            {webtoon.author ?? "작가 미상"}
          </p>
          {dayLabel ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {dayLabel}요일 연재
            </p>
          ) : null}
          {webtoon.description ? (
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {webtoon.description}
            </p>
          ) : null}
        </div>

        <div className="mt-8 space-y-2">
          <OpenWebtoonButton
            webtoonId={webtoon.id}
            platform={webtoon.platform}
            officialUrl={webtoon.platformUrl}
          />
          <StartSimilarAnalysisButton
            webtoonId={webtoon.id}
            title={webtoon.title}
            thumbnailUrl={webtoon.thumbnailUrl}
            platform={webtoon.platform}
            origin="SEO"
            source="seo"
          />
        </div>
      </div>
    </main>
  );
}
