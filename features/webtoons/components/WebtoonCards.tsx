"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import {
  GENRE_LABELS,
  STATUS_LABELS,
  type RankedWebtoon,
  type Webtoon,
} from "@/features/webtoons/model";
import { getEpisodeLabel } from "@/lib/episode";

type WebtoonSelectionCardProps = {
  webtoon: Webtoon;
  selected?: boolean;
  onSelect: (webtoon: Webtoon) => void;
};

export function WebtoonSelectionCard({
  webtoon,
  selected = false,
  onSelect,
}: WebtoonSelectionCardProps) {
  const coverSrc = webtoon.thumbnailUrl;

  return (
    <button
      type="button"
      onClick={() => onSelect(webtoon)}
      aria-pressed={selected}
      className="relative block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ aspectRatio: "2/3" }}
    >
      <WebtoonCover src={coverSrc} fill className="object-cover" />

      <div className="absolute left-1.5 top-1.5 z-10">
        <PlatformBadge
          platform={webtoon.platform}
          variant="overlay"
          size="sm"
        />
      </div>

      <div
        className={cn(
          "absolute inset-0 transition-all duration-200",
          selected ? "toona-selected-overlay" : "toona-gradient-overlay",
        )}
      />

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-lg">
              <Check
                className="h-4 w-4 text-primary-foreground"
                strokeWidth={3}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p
        className="absolute bottom-1.5 left-2 right-2 line-clamp-1 text-[10px] font-semibold leading-tight text-white"
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
      >
        {webtoon.title}
      </p>
    </button>
  );
}

type WebtoonRailCardProps = {
  webtoon: Webtoon | RankedWebtoon;
  onOpen: (webtoon: Webtoon) => void;
  size?: "sm" | "md" | "lg";
  layout?: "rail" | "grid";
  /** Platform-internal rank badge (not global #1) */
  showPlatformRank?: boolean;
};

const WIDTHS = {
  sm: "w-[104px]",
  md: "w-[120px] lg:w-[136px]",
  /** ~2.8 cards on 390px, ~7 cards on desktop content width */
  lg: "w-[118px] sm:w-[128px] md:w-[140px] lg:w-[148px] xl:w-[156px]",
};

export function WebtoonRailCard({
  webtoon,
  onOpen,
  size = "md",
  layout = "rail",
  showPlatformRank = false,
}: WebtoonRailCardProps) {
  const coverSrc = webtoon.thumbnailUrl;
  const episode = getEpisodeLabel({
    status: webtoon.status,
    latestEpisodeNumber: webtoon.latestEpisodeNumber,
    totalEpisodeCount: webtoon.totalEpisodeCount,
  });
  const genreLabel = webtoon.primaryGenre
    ? GENRE_LABELS[webtoon.primaryGenre]
    : webtoon.status
      ? STATUS_LABELS[webtoon.status]
      : "";
  const meta = episode || genreLabel;
  const platformRank =
    showPlatformRank && "ranking" in webtoon ? webtoon.ranking.rank : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(webtoon)}
      className={cn(
        "group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        layout === "grid" ? "w-full" : cn(WIDTHS[size], "shrink-0"),
      )}
    >
      <div className="relative mb-1.5 aspect-[2/3] w-full overflow-hidden rounded-xl bg-elevated md:mb-2 md:rounded-2xl">
        <WebtoonCover
          src={coverSrc}
          alt={webtoon.title}
          fill
          className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
        />
        <div className="absolute left-1.5 top-1.5 z-10 md:left-2 md:top-2">
          <PlatformBadge
            platform={webtoon.platform}
            variant="overlay"
            size="sm"
            label="desktop"
          />
        </div>
        {platformRank != null && platformRank <= 10 ? (
          <div className="absolute bottom-1.5 right-1.5 z-10 flex h-6 min-w-6 items-center justify-center rounded-md bg-[#0F1014]/80 px-1.5 text-[11px] font-bold text-foreground">
            {platformRank}
          </div>
        ) : null}
      </div>
      <p className="mt-0 line-clamp-2 text-[12px] font-medium leading-snug text-foreground md:line-clamp-1 md:text-[13px]">
        {webtoon.title}
      </p>
      {meta ? (
        <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground md:text-[11px]">
          {meta}
        </p>
      ) : null}
    </button>
  );
}
