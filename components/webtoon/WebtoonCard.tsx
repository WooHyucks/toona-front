"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { PlatformBadge } from "@/components/webtoon/PlatformBadge";
import { getDayLabel, type Webtoon } from "@/types/webtoon";
import { cn } from "@/lib/utils";

type WebtoonCardProps = {
  webtoon: Webtoon;
  selected?: boolean;
  dimmed?: boolean;
  showDay?: boolean;
  rank?: number;
  layoutId?: string;
  onSelect?: (webtoon: Webtoon) => void;
  onOpen?: (webtoon: Webtoon) => void;
  className?: string;
};

export function WebtoonCard({
  webtoon,
  selected = false,
  dimmed = false,
  showDay = true,
  rank,
  layoutId,
  onSelect,
  onOpen,
  className,
}: WebtoonCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      onClick={() => {
        onSelect?.(webtoon);
        onOpen?.(webtoon);
      }}
      className={cn(
        "group relative w-full text-left outline-none",
        dimmed && "opacity-45",
        className
      )}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      animate={
        reduceMotion
          ? undefined
          : selected
            ? { scale: 1.04 }
            : { scale: 1 }
      }
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-[16px] bg-muted ring-1 ring-border",
          selected && "ring-2 ring-primary"
        )}
      >
        {webtoon.thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={webtoon.thumb_url}
            alt={webtoon.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No Image
          </div>
        )}

        <div className="absolute left-1.5 top-1.5">
          <PlatformBadge platform={webtoon.platform} />
        </div>

        {typeof rank === "number" ? (
          <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">
            {rank}
          </span>
        ) : null}

        {showDay ? (
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
            {getDayLabel(webtoon.day_of_week)}
          </span>
        ) : null}

        {selected ? (
          <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>

      <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug text-foreground sm:text-sm">
        {webtoon.title}
      </p>
    </motion.button>
  );
}
