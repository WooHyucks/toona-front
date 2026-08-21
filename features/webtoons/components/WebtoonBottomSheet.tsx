"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Sparkles, X } from "lucide-react";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import {
  GenreChip,
  PlatformBadge,
} from "@/features/webtoons/components/PlatformBadge";
import {
  PLATFORM_BADGE_COLORS,
  PLATFORM_LABELS,
  formatDaysOfWeek,
  type Webtoon,
} from "@/features/webtoons/model";
import { getGenreLabels, getStatusLabel } from "@/features/webtoons/lib/sections";
import { getEpisodeLabel } from "@/lib/episode";
import { getOpenWebtoonCtaLabel, openWebtoon } from "@/lib/open-webtoon";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getSessionId } from "@/lib/session";
import { prepareTasteAnalysis } from "@/lib/taste-flow";
import { Button } from "@/components/ui/button";

type WebtoonBottomSheetProps = {
  webtoon: Webtoon | null;
  onClose: () => void;
};

export function WebtoonBottomSheet({ webtoon, onClose }: WebtoonBottomSheetProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!webtoon) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [webtoon, onClose]);

  if (!webtoon) return null;

  const coverSrc = webtoon.thumbnailUrl;
  const genres = getGenreLabels(webtoon);
  const statusLabel = getStatusLabel(webtoon);
  const isOngoing = webtoon.status === "ongoing" || !webtoon.status;
  const episode = getEpisodeLabel({
    status: webtoon.status,
    latestEpisodeNumber: webtoon.latestEpisodeNumber,
    totalEpisodeCount: webtoon.totalEpisodeCount,
  });
  const dayText =
    webtoon.daysOfWeek.length > 0
      ? `매주 ${formatDaysOfWeek(webtoon.daysOfWeek)} 연재`
      : null;
  const titleId = `webtoon-sheet-title-${webtoon.id}`;
  const descId = `webtoon-sheet-desc-${webtoon.id}`;

  function startSimilar() {
    const href = prepareTasteAnalysis(webtoon!.id, webtoon!.title, {
      origin: "HOME",
      source: "home",
      thumbnailUrl: webtoon!.thumbnailUrl,
      platform: webtoon!.platform,
    });
    onClose();
    router.push(href);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={webtoon.description ? descId : undefined}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />

        <motion.div
          className="relative flex w-full max-h-[90dvh] flex-col overflow-hidden rounded-t-[24px] bg-card md:max-w-lg md:rounded-[28px] lg:max-w-xl"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
        >
          <div className="flex shrink-0 justify-center pt-3 pb-1 md:hidden">
            <div className="h-[3px] w-8 rounded-full bg-border" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-elevated text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:right-4 md:top-4 md:h-9 md:w-9"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
            <div className="flex gap-3.5 px-4 pb-4 pt-2 sm:gap-4 sm:px-5 sm:pt-3">
              <div className="relative h-[120px] w-[80px] shrink-0 overflow-hidden rounded-xl bg-elevated shadow-lg sm:h-[132px] sm:w-[88px]">
                <WebtoonCover
                  src={coverSrc}
                  alt={webtoon.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 pt-0.5 pr-10 sm:pt-1 sm:pr-8">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <PlatformBadge platform={webtoon.platform} />
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isOngoing
                        ? "bg-success/20 text-success"
                        : "bg-elevated text-muted-foreground"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <h3
                  id={titleId}
                  className="text-[18px] font-bold leading-snug tracking-[-0.02em] text-foreground sm:text-[20px]"
                >
                  {webtoon.title}
                </h3>
                {webtoon.author ? (
                  <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground sm:text-[13px]">
                    {webtoon.author}
                  </p>
                ) : null}
                {episode ? (
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground sm:text-[12px]">
                    {episode}
                  </p>
                ) : null}
                {dayText ? (
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground sm:text-[12px]">
                    {dayText}
                  </p>
                ) : null}
                {genres.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {genres.slice(0, 4).map((g) => (
                      <GenreChip key={g} label={g} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {webtoon.description ? (
              <>
                <div className="h-px bg-border" />
                <div className="px-4 py-4 sm:px-5">
                  <p
                    id={descId}
                    className="text-[13px] leading-[1.7] text-muted-foreground sm:text-[14px]"
                  >
                    {webtoon.description}
                  </p>
                </div>
              </>
            ) : null}

            {webtoon.sourceTags.length > 0 ? (
              <div className="px-4 pb-2 sm:px-5">
                <div className="flex flex-wrap gap-1">
                  {webtoon.sourceTags.slice(0, 6).map((tag) => (
                    <GenreChip key={tag} label={tag} />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="px-4 pb-3 sm:px-5 sm:pb-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                플랫폼
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl bg-elevated px-3 py-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: PLATFORM_BADGE_COLORS[webtoon.platform].bg,
                  }}
                />
                <span className="text-[12px] font-medium text-foreground sm:text-[13px]">
                  {PLATFORM_LABELS[webtoon.platform]}
                </span>
              </div>
            </div>
          </div>

          <div
            className="shrink-0 space-y-2.5 border-t border-border bg-card px-4 pt-3 md:px-5"
            style={{
              paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
            }}
          >
            <Button
              type="button"
              className="h-12 w-full rounded-2xl text-[14px] font-semibold sm:h-[52px] sm:text-[15px]"
              onClick={startSimilar}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              이 작품과 비슷한 웹툰 찾기
            </Button>
            {webtoon.platformUrl || webtoon.platform === "kakao" ? (
              <Button
                type="button"
                variant="secondary"
                className="h-12 w-full rounded-2xl text-[14px] font-semibold sm:h-[52px]"
                onClick={() =>
                  openWebtoon({
                    webtoon: {
                      id: webtoon.id,
                      platform: webtoon.platform,
                      platformUrl: webtoon.platformUrl,
                    },
                    router,
                    action: {
                      sessionId: getSessionId(),
                      targetWebtoonId: webtoon.id,
                      actionType: "CLICKED",
                    },
                  })
                }
              >
                {webtoon.platform === "naver" ? (
                  <ExternalLink className="h-4 w-4" aria-hidden />
                ) : null}
                {getOpenWebtoonCtaLabel(webtoon.platform, {
                  isMobile,
                  officialUrl: webtoon.platformUrl,
                })}
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled
                className="h-12 w-full rounded-2xl opacity-40 sm:h-[52px]"
              >
                링크를 준비 중이에요
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
