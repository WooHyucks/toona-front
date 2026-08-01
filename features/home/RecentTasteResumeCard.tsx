"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import { toUiPlatform } from "@/lib/api/mappers";
import { track } from "@/lib/analytics";
import {
  clearRecentTasteSource,
  getRecentTasteSource,
  type RecentTasteSource,
} from "@/lib/recentTasteSource";
import { prepareTasteAnalysis } from "@/lib/taste-flow";
import { Button } from "@/components/ui/button";

type RecentTasteResumeCardProps = {
  browseAnchorId?: string;
};

export function RecentTasteResumeCard({
  browseAnchorId = "home-browse",
}: RecentTasteResumeCardProps) {
  const router = useRouter();
  const [recent, setRecent] = useState<RecentTasteSource | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const value = getRecentTasteSource();
    setRecent(value);
    if (value) {
      track("recent_recommendation_card_viewed", {
        webtoonId: value.webtoonId,
        source: value.source,
      });
    }
  }, []);

  if (!mounted || !recent) return null;

  const platform = recent.platform
    ? toUiPlatform(recent.platform)
    : null;

  function resume() {
    if (!recent) return;
    track("recent_recommendation_resumed", {
      webtoonId: recent.webtoonId,
      source: recent.source,
    });
    router.push(
      prepareTasteAnalysis(recent.webtoonId, recent.title, {
        source: "returning",
        origin: recent.source,
        thumbnailUrl: recent.thumbnailUrl,
        platform: recent.platform,
      })
    );
  }

  function pickAnother() {
    if (!recent) return;
    track("recent_recommendation_changed", {
      webtoonId: recent.webtoonId,
      source: recent.source,
    });
    const node = document.getElementById(browseAnchorId);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    router.push("/onboarding");
  }

  function clearRecent() {
    clearRecentTasteSource();
    setRecent(null);
  }

  return (
    <section
      aria-label="최근 선택한 웹툰"
      className="mt-4 rounded-2xl border border-border bg-card p-4"
    >
      <p className="text-[12px] font-medium text-muted-foreground">
        최근 선택한 웹툰
      </p>
      <div className="mt-3 flex gap-3">
        <div className="relative h-[88px] w-[64px] shrink-0 overflow-hidden rounded-xl bg-elevated">
          <WebtoonCover
            src={recent.thumbnailUrl || null}
            alt={recent.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {platform ? <PlatformBadge platform={platform} size="xs" /> : null}
          </div>
          <h2 className="mt-1 line-clamp-2 text-[16px] font-semibold leading-snug text-foreground">
            {recent.title}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {recent.title}과 비슷한 웹툰을 계속 찾아볼까요?
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button type="button" className="min-h-11 flex-1" onClick={resume}>
          추천 이어보기
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 flex-1"
          onClick={pickAnother}
        >
          다른 작품 고르기
        </Button>
      </div>
      <button
        type="button"
        onClick={clearRecent}
        className="mt-2 text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        최근 선택 지우기
      </button>
    </section>
  );
}
