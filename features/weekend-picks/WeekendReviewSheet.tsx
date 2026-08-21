"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOpenWebtoonCtaLabel, normalizePlatform } from "@/lib/open-webtoon";
import { postWebtoonAction } from "@/lib/api/actions";
import { getSessionId } from "@/lib/session";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import {
  isYoutubeShortsUrl,
  resolveYoutubeVideoId,
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from "@/lib/youtube";
import {
  trackWeekendReviewClose,
  trackWeekendReviewPlay,
  trackWeekendReviewReadClick,
} from "@/lib/analytics";
import type { WeekendPickItem } from "@/types/api";
import {
  getCachedOfficialUrl,
  resolvePickOfficialUrl,
  weekendOpenTarget,
  weekendReadHref,
} from "./open";

type Props = {
  item: WeekendPickItem | null;
  weekKey: string;
  onClose: () => void;
  /** Render inside the weekend-picks dialog instead of a nested drawer. */
  embedded?: boolean;
};

export function WeekendReviewSheet({
  item,
  weekKey,
  onClose,
  embedded = false,
}: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [iframeReady, setIframeReady] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [officialUrl, setOfficialUrl] = useState<string | null>(null);
  const closeSent = useRef(false);

  const review = item?.primaryReview ?? null;
  const videoId = review ? resolveYoutubeVideoId(review) : null;
  const videoType: "shorts" | "review" =
    review && isYoutubeShortsUrl(review.videoUrl) ? "shorts" : "review";
  const watchUrl = videoId
    ? youtubeWatchUrl(videoId)
    : review?.videoUrl?.trim() || null;
  const poster =
    review?.thumbnailUrl?.trim() ||
    (videoId ? youtubeThumbnailUrl(videoId) : null);

  useEffect(() => {
    setIframeReady(false);
    setEmbedFailed(false);
    closeSent.current = false;
    if (!item) return;
    const cached = getCachedOfficialUrl(item.webtoon.id);
    setOfficialUrl(item.webtoon.officialUrl?.trim() || cached);
    void resolvePickOfficialUrl(item.webtoon).then(setOfficialUrl);
  }, [item]);

  function emitClose() {
    if (!item || closeSent.current) return;
    closeSent.current = true;
    trackWeekendReviewClose({
      webtoonId: item.webtoon.id,
      title: item.webtoon.title,
      position: item.position,
      label: item.label,
      weekKey,
      videoId: videoId ?? undefined,
      videoType,
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      emitClose();
      onClose();
    }
  }

  function loadIframe() {
    if (!item || !videoId || iframeReady) return;
    setIframeReady(true);
    trackWeekendReviewPlay({
      webtoonId: item.webtoon.id,
      title: item.webtoon.title,
      position: item.position,
      label: item.label,
      weekKey,
      videoId,
      videoType,
    });
  }

  function onReadClick() {
    if (!item) return;
    const platform = String(item.webtoon.platform ?? "").toLowerCase();
    trackWeekendReviewReadClick({
      webtoonId: item.webtoon.id,
      title: item.webtoon.title,
      position: item.position,
      label: item.label,
      weekKey,
      platform: platform || "unknown",
      openTarget: weekendOpenTarget({
        platform: item.webtoon.platform,
        officialUrl,
        isMobile,
      }),
      videoId: videoId ?? undefined,
      videoType,
    });
  }

  const readHref = item
    ? weekendReadHref({
        platform: item.webtoon.platform,
        officialUrl,
        webtoonId: item.webtoon.id,
        isMobile,
      })
    : null;
  const ctaLabel = item
    ? normalizePlatform(item.webtoon.platform) === "KAKAO"
      ? "카카오웹툰에서 보기"
      : getOpenWebtoonCtaLabel(item.webtoon.platform, {
          isMobile,
          officialUrl,
        })
    : "";
  const naverBridge = item
    ? weekendOpenTarget({
        platform: item.webtoon.platform,
        officialUrl,
        isMobile,
      }) === "app_bridge"
    : false;

  if (!item) return null;

  const body = (
    <div className="relative flex min-h-0 flex-col">
      {embedded ? (
        <button
          type="button"
          aria-label="리뷰 닫기"
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted-foreground"
          onClick={() => {
            if (!embedded) emitClose();
            onClose();
          }}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      <div className={cn("shrink-0 px-5 pb-3", embedded ? "pt-5 pr-12" : "")}>
        <div className="flex items-center gap-2">
          <Badge variant="soft" className="text-[11px]">
            {videoType === "shorts" ? "SHORTS" : "REVIEW"}
          </Badge>
        </div>
        <h3 className="pt-1.5 text-[18px] font-semibold leading-snug tracking-tight text-foreground">
          {item.webtoon.title}
        </h3>
      </div>

      <div className="flex flex-col justify-center px-5 pb-3 md:px-8">
        <div className="mx-auto w-full max-w-[640px]">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            {iframeReady && videoId && !embedFailed ? (
              <iframe
                title={`${item.webtoon.title} 리뷰`}
                src={youtubeEmbedUrl(videoId)}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                onError={() => setEmbedFailed(true)}
              />
            ) : (
              <button
                type="button"
                className="absolute inset-0"
                onClick={loadIframe}
                disabled={!videoId}
                aria-label="리뷰 영상 재생"
              >
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={poster}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-full w-full bg-elevated" />
                )}
                <span className="absolute inset-0 bg-black/35" />
                <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-lg">
                  <Play className="h-6 w-6 fill-current" aria-hidden />
                </span>
              </button>
            )}
          </div>

          {embedFailed && watchUrl ? (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block rounded-xl border border-border px-4 py-3 text-center text-[13px] font-semibold text-foreground"
            >
              유튜브에서 리뷰 보기
            </a>
          ) : iframeReady && watchUrl ? (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[12px] text-muted-foreground"
            >
              유튜브에서 리뷰 보기
            </a>
          ) : null}

          {review?.title ? (
            <p className="mt-3 text-[14px] font-medium text-foreground">
              {review.title}
            </p>
          ) : null}
          {review?.channelTitle ? (
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {review.channelTitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-border px-5 py-4 md:px-8">
        <div className="mx-auto flex w-full flex-col items-center md:max-w-md">
        {readHref ? (
          <a
            href={readHref}
            target={
              naverBridge ||
              normalizePlatform(item.webtoon.platform) === "KAKAO"
                ? undefined
                : "_blank"
            }
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 text-[15px] font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            onClick={(event) => {
              onReadClick();
              void postWebtoonAction({
                sessionId: getSessionId(),
                targetWebtoonId: item.webtoon.id,
                actionType: "CLICKED",
              }).catch(() => {
                /* never block navigation */
              });
              if (normalizePlatform(item.webtoon.platform) === "KAKAO") {
                event.preventDefault();
                router.push(readHref);
              }
            }}
          >
            {ctaLabel}
          </a>
        ) : (
          <Button type="button" className="h-12 w-full" disabled>
            링크를 준비 중이에요
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="mt-2 h-12 w-full hover:bg-card hover:text-foreground"
          onClick={() => {
            if (!embedded) emitClose();
            onClose();
          }}
        >
          {embedded ? "작품 목록으로" : "닫기"}
        </Button>
        </div>
      </div>
    </div>
  );

  if (embedded) return body;

  return (
    <Drawer open onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{item.webtoon.title}</DrawerTitle>
          <DrawerDescription>{item.webtoon.title} 리뷰 영상</DrawerDescription>
        </DrawerHeader>
        {body}
      </DrawerContent>
    </Drawer>
  );
}
