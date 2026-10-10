"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { fetchWeekendPicks, getWeekendPickItems } from "@/lib/api/weekend-picks";
import {
  getCachedOfficialUrl,
  pickThumbnailUrl,
  resolvePickOfficialUrl,
} from "@/features/weekend-picks/open";
import { findPlatformLabel } from "@/features/find/platform";
import { FindCover } from "@/features/find/FindCover";
import type { WeekendPickItem } from "@/types/api";
import {
  trackFindToonapickClicked,
  trackFindToonapickShown,
} from "@/lib/analytics";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: "find_success" | "find_similar";
  findStatus?: string;
  attempt?: number;
  sessionId?: string | null;
};

export function FindToonaPickSheet({
  open,
  onOpenChange,
  source,
  findStatus,
  attempt,
  sessionId,
}: Props) {
  const [items, setItems] = useState<WeekendPickItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [officialUrl, setOfficialUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setIndex(0);
    setItems([]);
    setOfficialUrl(null);

    fetchWeekendPicks()
      .then((data) => {
        if (cancelled) return;
        const next = getWeekendPickItems(data);
        setItems(next);
        setFailed(next.length === 0);
        if (next.length > 0) {
          trackFindToonapickShown({
            source,
            find_status: findStatus,
            attempt,
            session_id: sessionId ?? undefined,
            pick_count: next.length,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, source, findStatus, attempt, sessionId]);

  const current = items[index] ?? null;

  useEffect(() => {
    if (!current) {
      setOfficialUrl(null);
      return;
    }
    const cached =
      current.webtoon.officialUrl?.trim() ||
      getCachedOfficialUrl(current.webtoon.id);
    setOfficialUrl(cached);
    void resolvePickOfficialUrl(current.webtoon).then(setOfficialUrl);
  }, [current]);

  const thumb = current ? pickThumbnailUrl(current.webtoon) : null;
  const platform = current
    ? findPlatformLabel(String(current.webtoon.platform ?? ""))
    : "";
  const reason = current?.reason?.trim() || "";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-[20px] tracking-[-0.02em]">
            오늘의 유저님을 위한 투나픽
          </DrawerTitle>
          <DrawerDescription>
            지금 정주행하기 좋은 작품을 골라봤어요.
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
          {loading ? (
            <div
              className="flex min-h-[240px] flex-col items-center justify-center"
              role="status"
              aria-busy="true"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
              <p className="mt-3 text-[14px] text-muted-foreground">
                투나픽을 불러오고 있어요...
              </p>
            </div>
          ) : null}

          {!loading && (failed || !current) ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
              <p className="text-[15px] font-semibold text-foreground">
                지금 바로 볼 픽을 준비하지 못했어요.
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                취향을 알려주시면 정주행 작품을 골라드릴게요.
              </p>
              <Button asChild className="mt-5 min-h-12 w-full max-w-sm text-[14px] font-semibold">
                <Link href="/onboarding" onClick={() => onOpenChange(false)}>
                  내 취향으로 추천받기
                </Link>
              </Button>
            </div>
          ) : null}

          {!loading && current ? (
            <div className="mx-auto w-full max-w-sm pb-2">
              <FindCover
                src={thumb}
                title={current.webtoon.title}
                priority
                className="mx-auto aspect-[2/3] w-[160px] md:w-[180px]"
              />
              <h3 className="mt-4 text-center text-[20px] font-bold leading-snug tracking-[-0.03em] text-foreground">
                {current.webtoon.title}
              </h3>
              {platform ? (
                <p className="mt-1 text-center text-[12px] text-muted-foreground">
                  {platform}
                </p>
              ) : null}
              {reason ? (
                <p className="mt-3 text-center text-[14px] leading-relaxed text-muted-foreground">
                  {reason}
                </p>
              ) : (
                <p className="mt-3 text-center text-[14px] leading-relaxed text-muted-foreground">
                  지금 정주행하기 좋은 작품이에요.
                </p>
              )}
            </div>
          ) : null}
        </div>

        {!loading && current ? (
          <DrawerFooter>
            {officialUrl ? (
              <Button asChild className="min-h-12 w-full text-[15px] font-semibold">
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${current.webtoon.title} 이 웹툰 보러가기, 새 탭`}
                  onClick={() =>
                    trackFindToonapickClicked({
                      source,
                      find_status: findStatus,
                      attempt,
                      session_id: sessionId ?? undefined,
                      title: current.webtoon.title,
                      platform: String(current.webtoon.platform ?? ""),
                      position: current.position,
                    })
                  }
                >
                  이 웹툰 보러가기
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </Button>
            ) : (
              <Button asChild className="min-h-12 w-full text-[15px] font-semibold">
                <Link
                  href={`/webtoon/${encodeURIComponent(current.webtoon.id)}`}
                  onClick={() => {
                    trackFindToonapickClicked({
                      source,
                      find_status: findStatus,
                      attempt,
                      session_id: sessionId ?? undefined,
                      title: current.webtoon.title,
                      platform: String(current.webtoon.platform ?? ""),
                      position: current.position,
                    });
                    onOpenChange(false);
                  }}
                >
                  이 웹툰 보러가기
                </Link>
              </Button>
            )}
            {items.length > 1 ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full text-[14px] font-semibold"
                onClick={() => setIndex((prev) => (prev + 1) % items.length)}
              >
                다른 픽 보기
              </Button>
            ) : null}
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
