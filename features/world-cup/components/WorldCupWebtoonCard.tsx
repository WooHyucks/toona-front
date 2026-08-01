"use client";

import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import { WebtoonThumbnail } from "@/features/webtoons/components/WebtoonThumbnail";
import { toUiPlatform } from "@/lib/api/mappers";
import { getEpisodeLabel } from "@/lib/episode";
import { cn } from "@/lib/utils";
import type { WorldCupWebtoon } from "@/types/api";
import { motion } from "framer-motion";

type WorldCupWebtoonCardProps = {
  webtoon: WorldCupWebtoon;
  side: "left" | "right";
  disabled?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  onSelect: () => void;
};

export function WorldCupWebtoonCard({
  webtoon,
  side,
  disabled,
  highlighted,
  dimmed,
  onSelect,
}: WorldCupWebtoonCardProps) {
  const platform = toUiPlatform(String(webtoon.platform ?? "NAVER"));
  const episode = getEpisodeLabel({
    status: webtoon.status,
    latestEpisodeNumber: webtoon.latestEpisodeNumber,
    totalEpisodeCount: webtoon.totalEpisodeCount,
  });

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-label={`${webtoon.title} 선택`}
      aria-pressed={highlighted}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      animate={{
        scale: highlighted ? 1.02 : 1,
        opacity: dimmed ? 0.45 : 1,
      }}
      transition={{ duration: 0.18 }}
      className={cn(
        "group flex w-full min-w-0 flex-col rounded-2xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        highlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <WebtoonThumbnail
        src={webtoon.thumbnailUrl}
        title={webtoon.title}
        platform={platform}
        priority
        seed={webtoon.id}
        className="rounded-2xl"
      />
      <div className="mt-2 min-w-0 px-0.5">
        <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground xs:text-[13px] sm:text-[14px]">
          {webtoon.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <PlatformBadge platform={platform} size="xs" label="desktop" />
          {episode ? (
            <span className="truncate text-[10px] text-muted-foreground">
              {episode}
            </span>
          ) : null}
        </div>
        <span className="sr-only">{side === "left" ? "왼쪽" : "오른쪽"} 작품</span>
      </div>
    </motion.button>
  );
}
