"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionId } from "@/lib/session";
import {
  getOpenWebtoonCtaLabel,
  normalizePlatform,
  openWebtoon,
} from "@/lib/open-webtoon";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

type Props = {
  webtoonId: string;
  platform: string | null | undefined;
  officialUrl: string | null | undefined;
  className?: string;
  /** When false, still allow KAKAO → viewer (detail API will resolve URL). */
  requireUrlForKakao?: boolean;
};

export function OpenWebtoonButton({
  webtoonId,
  platform,
  officialUrl,
  className,
  requireUrlForKakao = false,
}: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const p = normalizePlatform(platform);
  const hasUrl = Boolean(officialUrl?.trim());
  const canOpen =
    p === "KAKAO"
      ? requireUrlForKakao
        ? hasUrl
        : Boolean(webtoonId)
      : hasUrl;

  return (
    <Button
      type="button"
      disabled={!canOpen}
      className={cn("h-12 w-full", className)}
      onClick={() =>
        openWebtoon({
          webtoon: {
            id: webtoonId,
            platform,
            officialUrl,
          },
          router,
          action: {
            sessionId: getSessionId(),
            targetWebtoonId: webtoonId,
            actionType: "CLICKED",
          },
        })
      }
    >
      {p === "NAVER" ? (
        <ExternalLink className="h-4 w-4" aria-hidden />
      ) : null}
      {canOpen
        ? getOpenWebtoonCtaLabel(platform, { isMobile, officialUrl })
        : "링크를 준비 중이에요"}
    </Button>
  );
}
