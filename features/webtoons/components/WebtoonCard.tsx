"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import type { Webtoon } from "@/features/webtoons/model";

type WebtoonCardProps = {
  webtoon: Webtoon;
  selected?: boolean;
  dimmed?: boolean;
  onOpen?: (webtoon: Webtoon) => void;
};

export function WebtoonCard({
  webtoon,
  selected = false,
  dimmed = false,
  onOpen,
}: WebtoonCardProps) {
  const coverSrc = webtoon.thumbnailUrl;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(webtoon)}
      aria-pressed={selected}
      aria-label={`${webtoon.title}${selected ? ", 선택됨" : ""}`}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl text-left transition-all active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        dimmed && "opacity-40"
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-elevated">
        <WebtoonCover src={coverSrc} fill className="object-cover" />

        <div className="absolute left-1.5 top-1.5 z-10">
          <PlatformBadge platform={webtoon.platform} variant="overlay" size="sm" />
        </div>

        {!selected && (
          <div className="absolute inset-x-0 bottom-0 toona-gradient-overlay pt-10">
            <p className="px-2 pb-2 text-[11px] font-semibold leading-tight text-white line-clamp-2">
              {webtoon.title}
            </p>
          </div>
        )}

        {selected && (
          <div className="absolute inset-0 flex items-center justify-center toona-selected-overlay">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
