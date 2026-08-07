"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebtoonCard } from "@/components/webtoon/WebtoonCard";
import type { Webtoon } from "@/types/webtoon";
import { cn } from "@/lib/utils";

type WebtoonCarouselProps = {
  webtoons: Webtoon[];
  onOpen: (webtoon: Webtoon) => void;
  className?: string;
};

export function WebtoonCarousel({
  webtoons,
  onOpen,
  className,
}: WebtoonCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateButtons();
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
  }, [emblaApi, updateButtons]);

  return (
    <div className={cn("group relative", className)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 pl-4 touch-pan-y sm:pl-6">
          {webtoons.map((webtoon, index) => (
            <div
              key={webtoon.id}
              className="min-w-0 shrink-0 basis-[34%] sm:basis-[22%] md:basis-[18%] lg:basis-[14%]"
            >
              <WebtoonCard
                webtoon={webtoon}
                rank={index < 10 ? index + 1 : undefined}
                onOpen={onOpen}
              />
            </div>
          ))}
          <div className="w-4 shrink-0 sm:w-6" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 hidden items-center md:flex">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="이전"
          className="pointer-events-auto ml-1 opacity-0 shadow-md transition group-hover:opacity-100"
          disabled={!canPrev}
          onClick={() => emblaApi?.scrollPrev()}
        >
          <ChevronLeft />
        </Button>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center md:flex">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="다음"
          className="pointer-events-auto mr-1 opacity-0 shadow-md transition group-hover:opacity-100"
          disabled={!canNext}
          onClick={() => emblaApi?.scrollNext()}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between px-4 sm:px-6">
      <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
      {href ? (
        <Button asChild variant="ghost" size="icon" className="h-9 w-9">
          <Link href={href} aria-label={`${title} 전체 보기`}>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
