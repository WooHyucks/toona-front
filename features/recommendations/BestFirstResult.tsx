"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { normalizePlatform, openWebtoon } from "@/lib/open-webtoon";
import { getEpisodeStatusLine, serializationStatusLabel } from "@/lib/episode";
import {
  track,
  trackAlternativeRecommendationReadClick,
  trackBestRecommendationReadClick,
  trackRecommendationWebtoonClicked,
} from "@/lib/analytics";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { RecommendationItem, RecommendationType } from "@/types/api";
import { cn } from "@/lib/utils";

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

function roleLabel(
  type: RecommendationType | string | undefined,
  t: ReturnType<typeof useT>
): string {
  const key = String(type || "").toUpperCase();
  if (key === "BEST_MATCH" || key === "BEST") return t("result.roleBest");
  if (key === "DISCOVERY") return t("result.roleDiscovery");
  if (key === "BINGE") return t("result.roleBinge");
  return t("result.rolePick");
}

function normalizeCopy(value: string | null | undefined): string {
  return (value || "").trim().replace(/\s+/g, " ");
}

function genreLine(item: RecommendationItem): string | null {
  const genres = (item.webtoon.genres || [])
    .map((g) => String(g).trim())
    .filter(Boolean)
    .slice(0, 3);
  if (genres.length === 0) {
    const tags = (item.matchedTags || [])
      .map((tag) => tag.label?.trim())
      .filter(Boolean)
      .slice(0, 3) as string[];
    return tags.length ? tags.join(" · ") : null;
  }
  return genres.join(" · ");
}

type OpenArgs = {
  item: RecommendationItem;
  sourceId: string;
  sessionId: string;
  fromShare: boolean;
  role: "best" | "alternative";
  position: number;
  refreshCount?: number;
};

function openRecommended(
  router: ReturnType<typeof useRouter>,
  { item, sourceId, sessionId, fromShare, role, position, refreshCount }: OpenArgs
) {
  const meta = recAnalytics(item);
  if (role === "best") trackBestRecommendationReadClick(meta);
  else trackAlternativeRecommendationReadClick(meta);
  trackRecommendationWebtoonClicked({
    source_webtoon_id: sourceId,
    recommended_webtoon_id: item.webtoon.id,
    recommendation_position: position,
    refresh_count: refreshCount ?? 0,
  });
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

export type RecommendationPickCardProps = {
  item: RecommendationItem;
  sourceId: string;
  sessionId: string;
  fromShare: boolean;
  position: number;
  refreshCount?: number;
  priority?: boolean;
  className?: string;
};

/** Full discovery card — used for all 3 result picks. */
export function RecommendationPickCard({
  item,
  sourceId,
  sessionId,
  fromShare,
  position,
  refreshCount = 0,
  priority = false,
  className,
}: RecommendationPickCardProps) {
  const t = useT();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const canOpen = canOpenItem(item);
  const meta = episodeLine(item);
  const hook = normalizeCopy(item.webtoon.hookPhrase);
  const reason = normalizeCopy(item.recommendationReason);
  const showReason = Boolean(reason) && reason !== hook;
  const genres = genreLine(item);
  const badge = String(position).padStart(2, "0");

  return (
    <motion.article
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : (position - 1) * 0.05 }}
      className={cn(
        "overflow-hidden rounded-[22px] border border-border/80 bg-card",
        className
      )}
    >
      <div className="p-3.5 md:p-4">
        <div className="flex gap-3.5">
          <div className="relative h-[148px] w-[98px] shrink-0 overflow-hidden rounded-xl bg-elevated md:h-[168px] md:w-[112px] md:rounded-2xl">
            <WebtoonCover
              src={item.webtoon.thumbnailUrl || null}
              alt={item.webtoon.title}
              fill
              priority={priority}
              className="object-cover object-top"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold tracking-[0.08em] text-primary md:text-[11px]">
                {t("result.pickBadge", { n: badge })}
              </p>
              <p className="truncate text-[10px] font-medium text-muted-foreground md:text-[11px]">
                {roleLabel(item.recommendationType, t)}
              </p>
            </div>

            <h2 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.02em] text-foreground md:text-[17px]">
              {item.webtoon.title}
            </h2>

            {hook ? (
              <p className="mt-1.5 line-clamp-3 text-[13px] font-semibold leading-snug text-foreground md:text-[14px]">
                {hook}
              </p>
            ) : null}

            {genres || meta ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                {genres ? (
                  <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-muted-foreground md:text-[11px]">
                    {genres}
                  </span>
                ) : null}
                {meta ? (
                  <span className="text-[10px] text-muted-foreground md:text-[11px]">
                    {meta}
                  </span>
                ) : null}
              </div>
            ) : null}

            {showReason ? (
              <div className="mt-auto pt-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-primary">
                  {t("result.whyThis")}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-foreground/90">
                  {reason}
                </p>
              </div>
            ) : (
              <div className="mt-auto" />
            )}
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
              role: position === 1 ? "best" : "alternative",
              position,
              refreshCount,
            })
          }
          className="mt-3.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-primary text-[14px] font-semibold text-primary-foreground transition-opacity active:opacity-90 disabled:opacity-40 md:min-h-12 md:text-[15px]"
        >
          {canOpen ? t("result.openWebtoon") : t("common.preparingLink")}
          {canOpen ? <ExternalLink className="h-3.5 w-3.5" aria-hidden /> : null}
        </button>
      </div>
    </motion.article>
  );
}

/** @deprecated Prefer RecommendationPickCard — kept for any external imports */
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
  return (
    <RecommendationPickCard
      item={item}
      sourceId={sourceId}
      sessionId={sessionId}
      fromShare={fromShare}
      position={1}
      priority
    />
  );
}

/** @deprecated Prefer RecommendationPickCard */
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
  return (
    <RecommendationPickCard
      item={item}
      sourceId={sourceId}
      sessionId={sessionId}
      fromShare={fromShare}
      position={2}
    />
  );
}
