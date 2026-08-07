"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WebtoonRailCard } from "@/features/webtoons/components/WebtoonCards";
import { useWebtoonSheet } from "@/features/shell/WebtoonSheetContext";
import type { HomeRail } from "@/features/rankings/model/ranking-utils";
import {
  HORIZONTAL_RAIL_EMBLA_OPTIONS,
  HORIZONTAL_RAIL_TOUCH_CLASS,
} from "@/lib/embla-rail";
import { cn } from "@/lib/utils";

type RankingRailProps = {
  rail: HomeRail;
  showPlatformRank?: boolean;
  className?: string;
};

export function RankingRail({
  rail,
  showPlatformRank = true,
  className,
}: RankingRailProps) {
  const { openWebtoon } = useWebtoonSheet();
  const [emblaRef, emblaApi] = useEmblaCarousel(HORIZONTAL_RAIL_EMBLA_OPTIONS);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      if (!emblaApi) return;
      const inView = emblaApi.slidesInView().length;
      const step = Math.max(inView - 1, 4);
      const current = emblaApi.selectedScrollSnap();
      const last = emblaApi.scrollSnapList().length - 1;
      const target = Math.min(last, Math.max(0, current + direction * step));
      emblaApi.scrollTo(target);
    },
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;
    updateButtons();
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    emblaApi.on("scroll", updateButtons);
    const timer = window.setTimeout(() => emblaApi.reInit(), 120);
    return () => {
      window.clearTimeout(timer);
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
      emblaApi.off("scroll", updateButtons);
    };
  }, [emblaApi, updateButtons, rail.items]);

  const hideRank =
    rail.id === "completed" ||
    rail.id === "fantasy" ||
    rail.id === "action" ||
    rail.id === "romance" ||
    rail.id === "historical" ||
    rail.id === "today";

  return (
    <section
      id={`rail-${rail.id}`}
      className={cn("mt-8 scroll-mt-20 lg:mt-10", className)}
      aria-labelledby={`rail-title-${rail.id}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
        <h2
          id={`rail-title-${rail.id}`}
          className="text-[15px] font-semibold tracking-[-0.01em] text-foreground md:text-[16px] lg:text-[17px]"
        >
          {rail.title}
        </h2>
        <div className="hidden items-center gap-1 md:flex">
          <button
            type="button"
            aria-label={`${rail.title} 이전`}
            disabled={!canPrev}
            onClick={() => scrollByPage(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-elevated text-foreground transition-opacity disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`${rail.title} 다음`}
            disabled={!canNext}
            onClick={() => scrollByPage(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-elevated text-foreground transition-opacity disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* touch-pan-y: vertical page scroll works when gesture starts on a thumbnail.
          Embla still handles horizontal drag (official Embla horizontal-rail setup). */}
      <div className="relative -mx-4 md:mx-0">
        <div className="overflow-hidden overscroll-x-contain" ref={emblaRef}>
          <div
            className={cn(
              "flex gap-3 px-4 md:gap-4 md:px-0",
              HORIZONTAL_RAIL_TOUCH_CLASS
            )}
          >
            {rail.items.map((webtoon) => (
              <div
                key={`${rail.id}-${webtoon.id}-${webtoon.ranking.rank}`}
                className="w-[118px] shrink-0 grow-0 sm:w-[128px] md:w-[140px] lg:w-[148px] xl:w-[156px]"
              >
                <WebtoonRailCard
                  webtoon={webtoon}
                  onOpen={openWebtoon}
                  size="lg"
                  layout="grid"
                  showPlatformRank={showPlatformRank && !hideRank}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
