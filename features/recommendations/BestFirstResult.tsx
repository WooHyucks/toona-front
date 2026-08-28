"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import {
  getOpenWebtoonCtaLabel,
  normalizePlatform,
  openWebtoon,
} from "@/lib/open-webtoon";
import { toUiPlatform } from "@/lib/api/mappers";
import { getEpisodeStatusLine, serializationStatusLabel } from "@/lib/episode";
import {
  track,
  trackAlternativeRecommendationReadClick,
  trackBestRecommendationReadClick,
} from "@/lib/analytics";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { RecommendationItem } from "@/types/api";

function recAnalytics(item: RecommendationItem) {
  const episodeCount =
    item.episodeCount ??
    item.webtoon.episodeCount ??
    item.webtoon.totalEpisodeCount ??
    item.webtoon.latestEpisodeNumber ??
    null;
  const serializationStatus =
    serializationStatusLabel(
      item.serializationStatus ??
        item.webtoon.serializationStatus ??
        item.webtoon.status
    ) ??
    item.serializationStatus ??
    item.webtoon.serializationStatus ??
    item.webtoon.status ??
    null;
  return {
    webtoonId: item.webtoon.id,
    title: item.webtoon.title,
    episodeCount,
    serializationStatus:
      serializationStatus != null ? String(serializationStatus) : null,
    platform: String(item.webtoon.platform ?? "").toLowerCase() || null,
  };
}

function episodeLine(item: RecommendationItem): string | null {
  return getEpisodeStatusLine({
    episodeCount: item.episodeCount ?? item.webtoon.episodeCount,
    serializationStatus:
      item.serializationStatus ?? item.webtoon.serializationStatus,
    status: item.webtoon.status,
    latestEpisodeNumber: item.webtoon.latestEpisodeNumber,
    totalEpisodeCount: item.webtoon.totalEpisodeCount,
  });
}

function canOpenItem(item: RecommendationItem): boolean {
  const platform = normalizePlatform(String(item.webtoon.platform));
  const hasUrl = Boolean(item.webtoon.officialUrl);
  return platform === "KAKAO" ? Boolean(item.webtoon.id) : hasUrl;
}

type OpenArgs = {
  item: RecommendationItem;
  sourceId: string;
  sessionId: string;
  fromShare: boolean;
  role: "best" | "alternative";
};

function openRecommended(
  router: ReturnType<typeof useRouter>,
  { item, sourceId, sessionId, fromShare, role }: OpenArgs
) {
  const meta = recAnalytics(item);
  if (role === "best") trackBestRecommendationReadClick(meta);
  else trackAlternativeRecommendationReadClick(meta);
  if (fromShare) {
    track("shared_recommendation_webtoon_clicked", {
      sourceWebtoonId: sourceId,
      targetWebtoonId: item.webtoon.id,
    });
  }
  openWebtoon({
    webtoon: {
      id: item.webtoon.id,
      platform: item.webtoon.platform,
      officialUrl: item.webtoon.officialUrl,
    },
    router,
    action: {
      sessionId,
      sourceWebtoonId: sourceId,
      targetWebtoonId: item.webtoon.id,
      actionType: "CLICKED",
      recommendationType: item.recommendationType,
    },
  });
}

export function BestRecommendationCard({
  item,
  sourceId,
  sessionId,
  fromShare,
}: {
  item: RecommendationItem;
  sourceId: string;
  sessionId: string;
  fromShare: boolean;
}) {
  const router = useRouter();
  const canOpen = canOpenItem(item);
  const meta = episodeLine(item);
  const reason = item.recommendationReason?.trim();

  return (
    <article className="rounded-2xl bg-card p-4">
      <div className="mx-auto w-[42%] max-w-[168px]">
        <div className="relative aspect-[2/3] max-h-[32vh] w-full overflow-hidden rounded-2xl bg-elevated">
          <WebtoonCover
            src={item.webtoon.thumbnailUrl || null}
            alt={item.webtoon.title}
            fill
            priority
            className="object-cover object-top"
          />
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] font-semibold tracking-wide text-primary">
        TOONA PICK
      </p>
      <h2 className="mt-1 text-center text-[20px] font-bold leading-snug tracking-[-0.02em] text-foreground">
        {item.webtoon.title}
      </h2>
      {reason ? (
        <p className="mt-2 line-clamp-3 text-center text-[14px] leading-relaxed text-foreground">
          {reason}
        </p>
      ) : null}
      {meta ? (
        <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
          {meta}
        </p>
      ) : null}
      <button
        type="button"
        disabled={!canOpen}
        onClick={() =>
          openRecommended(router, {
            item,
            sourceId,
            sessionId,
            fromShare,
            role: "best",
          })
        }
        className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-40"
      >
        {canOpen ? "정주행 시작하기" : "링크를 준비 중이에요"}
      </button>
    </article>
  );
}

export function AlternativeRecommendationCard({
  item,
  sourceId,
  sessionId,
  fromShare,
}: {
  item: RecommendationItem;
  sourceId: string;
  sessionId: string;
  fromShare: boolean;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const canOpen = canOpenItem(item);
  const platform = normalizePlatform(String(item.webtoon.platform));
  const meta = episodeLine(item);
  const ctaLabel = canOpen
    ? getOpenWebtoonCtaLabel(item.webtoon.platform, {
        isMobile,
        officialUrl: item.webtoon.officialUrl,
      })
    : "준비 중";

  return (
    <article className="flex flex-col rounded-2xl bg-card p-3">
      <div className="flex gap-2.5">
        <div
          className="relative w-[56px] shrink-0 overflow-hidden rounded-xl bg-elevated"
          style={{ aspectRatio: "2/3" }}
        >
          <WebtoonCover
            src={item.webtoon.thumbnailUrl || null}
            alt={item.webtoon.title}
            fill
            className="object-cover object-top"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-foreground">
            {item.webtoon.title}
          </h3>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1">
            <PlatformBadge
              platform={toUiPlatform(String(item.webtoon.platform))}
            />
            {meta ? (
              <span className="min-w-0 truncate text-[11px] text-muted-foreground">
                {meta}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={!canOpen}
        onClick={() =>
          openRecommended(router, {
            item,
            sourceId,
            sessionId,
            fromShare,
            role: "alternative",
          })
        }
        className="mt-3 flex min-h-10 w-full items-center justify-center gap-1 rounded-xl border border-border text-[12px] font-semibold text-foreground disabled:opacity-40"
      >
        {platform === "NAVER" ? (
          <ExternalLink className="h-3 w-3" aria-hidden />
        ) : null}
        {ctaLabel}
      </button>
    </article>
  );
}
