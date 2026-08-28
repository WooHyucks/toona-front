"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchWeekendPicks, getWeekendPickItems } from "@/lib/api/weekend-picks";
import {
  trackWeekendPersonalizeClick,
  trackWeekendPicksButtonClick,
  trackWeekendPicksView,
  trackWeekendReviewClose,
  trackWeekendReviewOpen,
} from "@/lib/analytics";
import { isYoutubeShortsUrl, resolveYoutubeVideoId } from "@/lib/youtube";
import { HORIZONTAL_RAIL_TOUCH_CLASS } from "@/lib/embla-rail";
import { cn } from "@/lib/utils";
import type { WeekendPickItem } from "@/types/api";
import { WeekendPickCard } from "./WeekendPickCard";
import { WeekendReviewSheet } from "./WeekendReviewSheet";
import { resolvePickOfficialUrl } from "./open";
import { markWeekendPicksSeen } from "@/lib/session";

const AUTO_MS = 4500;

type Props = {
  onPersonalize?: () => void;
  onAvailableChange?: (available: boolean) => void;
  reopenKey?: number;
};

export function WeekendPicksSection({
  onPersonalize,
  onAvailableChange,
  reopenKey = 0,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<WeekendPickItem[]>([]);
  const [weekKey, setWeekKey] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<WeekendPickItem | null>(null);
  const [snap, setSnap] = useState(0);
  const loop = items.length > 1;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop,
    align: "center",
    containScroll: false,
    dragFree: false,
    skipSnaps: false,
  });

  const onAvailableChangeRef = useRef(onAvailableChange);
  onAvailableChangeRef.current = onAvailableChange;

  useEffect(() => {
    const controller = new AbortController();
    fetchWeekendPicks(controller.signal)
      .then((data) => {
        const next = getWeekendPickItems(data);
        setItems(next);
        setWeekKey(data.weekKey ?? "");
        const available = next.length > 0;
        onAvailableChangeRef.current?.(available);
        if (!available) return;
        next.forEach((item) => {
          void resolvePickOfficialUrl(item.webtoon);
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setItems([]);
        setOpen(false);
        onAvailableChangeRef.current?.(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (reopenKey > 0 && items.length > 0) {
      trackWeekendPicksButtonClick(weekKey);
      setActive(null);
      setOpen(true);
    }
  }, [reopenKey, items.length, weekKey]);

  useEffect(() => {
    if (!open || items.length === 0) return;
    trackWeekendPicksView(weekKey, items.length);
  }, [open, items.length, weekKey]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => markWeekendPicksSeen(), 400);
    return () => window.clearTimeout(timer);
  }, [open]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSnap(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || !open || active) return;
    const timer = window.setTimeout(() => {
      emblaApi.reInit();
      emblaApi.scrollTo(emblaApi.selectedScrollSnap(), true);
    }, 80);
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      window.clearTimeout(timer);
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect, items, open, active]);

  useEffect(() => {
    if (!loop || !emblaApi || !open || active || reduceMotion) {
      return;
    }
    const id = window.setInterval(() => {
      emblaApi.scrollNext();
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [loop, emblaApi, open, active, reduceMotion]);

  function openReview(item: WeekendPickItem) {
    const review = item.primaryReview;
    const videoId = review ? resolveYoutubeVideoId(review) : null;
    if (!review || !videoId) return;
    trackWeekendReviewOpen({
      webtoonId: item.webtoon.id,
      title: item.webtoon.title,
      position: item.position,
      label: item.label,
      weekKey,
      videoId,
      videoType: isYoutubeShortsUrl(review.videoUrl) ? "shorts" : "review",
    });
    setActive(item);
  }

  function closeReview() {
    if (active) {
      const review = active.primaryReview;
      const videoId = review ? resolveYoutubeVideoId(review) : null;
      trackWeekendReviewClose({
        webtoonId: active.webtoon.id,
        title: active.webtoon.title,
        position: active.position,
        label: active.label,
        weekKey,
        videoId: videoId ?? undefined,
        videoType:
          review && isYoutubeShortsUrl(review.videoUrl) ? "shorts" : "review",
      });
    }
    setActive(null);
  }

  function closeModal() {
    markWeekendPicksSeen();
    setActive(null);
    setOpen(false);
  }

  if (items.length === 0) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        if (active) {
          closeReview();
          return;
        }
        closeModal();
      }}
    >
      <DialogContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          "fixed inset-0 left-0 top-0 h-[100dvh] max-h-[100dvh] w-full max-w-none",
          "translate-x-0 translate-y-0 rounded-none border-0 bg-black/80 shadow-none",
          "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
          "md:inset-auto md:left-[50%] md:top-[50%] md:h-auto md:max-h-[88dvh]",
          "md:w-[calc(100%-2rem)] md:max-w-[920px] md:translate-x-[-50%] md:translate-y-[-50%]",
          "md:rounded-3xl md:border md:border-border md:bg-background md:shadow-lg",
          "md:data-[state=open]:zoom-in-95",
          "[&>button]:z-30 [&>button]:opacity-100 [&>button]:hover:opacity-100",
          "[&>button]:text-white md:[&>button]:text-foreground",
          active && "[&>button]:hidden"
        )}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain md:overflow-hidden">
          <div
            className={cn(
              "flex min-h-full w-full flex-col justify-center md:min-h-0 md:justify-start md:py-0",
              "px-0 pt-[max(2.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            )}
          >
            <DialogHeader className="shrink-0 px-5 pb-4 text-center md:px-6 md:pb-3 md:pt-5 md:pr-12 md:text-left">
              <p className="text-[12px] font-medium text-primary">
                이번 주말 투나 PICK
              </p>
              <DialogTitle className="pt-1 text-[20px] leading-snug tracking-[-0.02em] text-white md:text-[22px] md:text-foreground">
                이번 주말, 투나가 3개 골라봤어요
              </DialogTitle>
              <DialogDescription className="text-[13px] text-white/70 md:text-muted-foreground">
                지금 시작하면 멈추기 힘든 작품들만 골랐어요.
              </DialogDescription>
            </DialogHeader>

            <div className="w-full md:min-h-0 md:flex-1 md:overflow-y-auto">
              <div className="relative md:hidden">
                <div
                  ref={emblaRef}
                  className={cn("overflow-hidden", HORIZONTAL_RAIL_TOUCH_CLASS)}
                >
                  <div className="flex items-stretch">
                    {items.map((item, index) => (
                      <div
                        key={item.webtoon.id}
                        className="min-w-0 shrink-0 grow-0 basis-[72%] px-2"
                      >
                        <WeekendPickCard
                          compact
                          item={item}
                          weekKey={weekKey}
                          priority={index === 0}
                          onReview={() => openReview(item)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {loop ? (
                  <div className="mt-3 flex justify-center gap-1.5">
                    {items.map((item, index) => (
                      <button
                        key={item.webtoon.id}
                        type="button"
                        aria-label={`${index + 1}번째 작품`}
                        onClick={() => emblaApi?.scrollTo(index)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          index === snap
                            ? "w-4 bg-primary"
                            : "w-1.5 bg-white/30"
                        )}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="hidden px-6 pb-1 md:block">
                <div className="grid grid-cols-3 gap-4">
                  {items.map((item, index) => (
                    <WeekendPickCard
                      key={item.webtoon.id}
                      item={item}
                      weekKey={weekKey}
                      priority={index === 0}
                      onReview={() => openReview(item)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 px-5 pt-4 md:border-t md:border-border md:px-6 md:py-4">
              <p className="text-center text-[13px] font-medium text-white/70 md:text-muted-foreground">
                셋 다 취향이 아니라면?
              </p>
              <button
                type="button"
                onClick={() => {
                  trackWeekendPersonalizeClick(weekKey);
                  closeModal();
                  onPersonalize?.();
                }}
                className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-[15px] font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground md:mx-auto md:max-w-md"
              >
                내 취향으로 추천받기
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <p className="mt-2 text-center text-[12px] text-white/55 md:text-muted-foreground">
                재밌게 본 웹툰 하나만 알려주면 돼요.
              </p>
            </div>
          </div>

          {active ? (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-4 md:p-6"
              onClick={closeReview}
            >
              <div
                className="relative flex max-h-full w-full max-w-[640px] flex-col overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <WeekendReviewSheet
                  embedded
                  item={active}
                  weekKey={weekKey}
                  onClose={closeReview}
                />
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
