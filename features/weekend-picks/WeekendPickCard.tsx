"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import { Button } from "@/components/ui/button";
import { getSessionId } from "@/lib/session";
import { postWebtoonAction } from "@/lib/api/actions";
import { normalizePlatform, openWebtoon } from "@/lib/open-webtoon";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import {
  trackWeekendDirectReadClick,
  trackWeekendPickImpression,
} from "@/lib/analytics";
import type { WeekendPickItem } from "@/types/api";
import {
  getCachedOfficialUrl,
  pickThumbnailUrl,
  resolvePickOfficialUrl,
  weekendOpenTarget,
  weekendReadHref,
} from "./open";

type Props = {
  item: WeekendPickItem;
  weekKey: string;
  priority?: boolean;
  className?: string;
  onReview: () => void;
};

export function WeekendPickCard({
  item,
  weekKey,
  priority,
  className,
  onReview,
}: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const rootRef = useRef<HTMLElement | null>(null);
  const review = item.primaryReview;
  const hasReview = Boolean(review?.videoId || review?.videoUrl);
  const thumb = pickThumbnailUrl(item.webtoon);
  const [officialUrl, setOfficialUrl] = useState<string | null>(
    item.webtoon.officialUrl?.trim() || getCachedOfficialUrl(item.webtoon.id)
  );

  useEffect(() => {
    void resolvePickOfficialUrl(item.webtoon).then(setOfficialUrl);
  }, [item.webtoon]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        trackWeekendPickImpression({
          webtoonId: item.webtoon.id,
          title: item.webtoon.title,
          position: item.position,
          label: item.label,
          weekKey,
        });
        observer.disconnect();
      },
      { threshold: 0.45 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [item, weekKey]);

  function emitDirectRead(nextOfficialUrl: string | null) {
    trackWeekendDirectReadClick({
      webtoonId: item.webtoon.id,
      title: item.webtoon.title,
      position: item.position,
      label: item.label,
      weekKey,
      platform: String(item.webtoon.platform ?? "").toLowerCase() || "unknown",
      openTarget: weekendOpenTarget({
        platform: item.webtoon.platform,
        officialUrl: nextOfficialUrl,
        isMobile,
      }),
    });
    void postWebtoonAction({
      sessionId: getSessionId(),
      targetWebtoonId: item.webtoon.id,
      actionType: "CLICKED",
    }).catch(() => {
      /* never block navigation */
    });
  }

  async function onDirectRead() {
    const resolved = await resolvePickOfficialUrl(item.webtoon);
    setOfficialUrl(resolved);
    emitDirectRead(resolved);
    openWebtoon({
      webtoon: {
        id: item.webtoon.id,
        platform: item.webtoon.platform,
        officialUrl: resolved,
      },
      router,
    });
  }

  const isNaver = normalizePlatform(item.webtoon.platform) === "NAVER";
  const readHref = weekendReadHref({
    platform: item.webtoon.platform,
    officialUrl,
    webtoonId: item.webtoon.id,
    isMobile,
  });
  const naverBridge =
    weekendOpenTarget({
      platform: item.webtoon.platform,
      officialUrl,
      isMobile,
    }) === "app_bridge";

  const actions = (
    <div className="mt-auto flex gap-2 pt-3">
      {hasReview ? (
        <Button
          type="button"
          size="sm"
          className="h-10 min-h-10 flex-1 px-2.5 text-[13px]"
          onClick={onReview}
        >
          ▶ 리뷰로 찍먹
        </Button>
      ) : null}
      {isNaver && readHref ? (
        <Button
          asChild
          size="sm"
          variant={hasReview ? "outline" : "default"}
          className="h-10 min-h-10 flex-1 px-2.5 text-[13px]"
        >
          <a
            href={readHref}
            target={naverBridge ? undefined : "_blank"}
            rel="noopener noreferrer"
            onClick={() => emitDirectRead(officialUrl)}
          >
            바로 보러가기
          </a>
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant={hasReview ? "outline" : "default"}
          className="h-10 min-h-10 flex-1 px-2.5 text-[13px]"
          onClick={() => void onDirectRead()}
        >
          바로 보러가기
        </Button>
      )}
    </div>
  );

  return (
    <article
      ref={rootRef}
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
        className
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-elevated">
        <WebtoonCover
          src={thumb}
          alt={item.webtoon.title}
          fill
          priority={priority}
          className="object-cover object-top"
        />
      </div>
      <div className="flex flex-1 flex-col p-3">
        {item.label ? (
          <p className="text-[11px] font-semibold tracking-tight text-primary">
            {item.label}
          </p>
        ) : null}
        <h3 className="mt-0.5 text-[16px] font-bold leading-snug text-foreground">
          {item.webtoon.title}
        </h3>
        {item.reason ? (
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            {item.reason}
          </p>
        ) : null}
        {actions}
      </div>
    </article>
  );
}
