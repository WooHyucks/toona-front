"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { fetchWebtoonDetail } from "@/lib/api/webtoons";
import { ToonaApiError } from "@/lib/api/client";
import {
  normalizePlatform,
  openOfficialInNewTab,
  openNaverOfficial,
  getOpenWebtoonCtaLabel,
} from "@/lib/open-webtoon";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ToonaLogo } from "@/components/brand/ToonaLogo";
import { Button } from "@/components/ui/button";
import type { WebtoonDetail } from "@/types/api";

const HEADER_H = 48;

type Props = {
  webtoonId: string;
};

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "naver"; webtoon: WebtoonDetail }
  | { kind: "kakao"; webtoon: WebtoonDetail }
  | { kind: "no_url"; webtoon: WebtoonDetail };

export function WebtoonViewerClient({ webtoonId }: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPhase({ kind: "loading" });
    setIframeReady(false);

    (async () => {
      try {
        if (!webtoonId) {
          if (!cancelled) {
            setPhase({ kind: "error", message: "웹툰을 열 수 없어요." });
          }
          return;
        }

        const detail = await fetchWebtoonDetail(webtoonId);
        if (cancelled) return;

        const platform = normalizePlatform(detail.platform);
        const url = detail.officialUrl?.trim() || null;

        if (platform === "NAVER") {
          setPhase({ kind: "naver", webtoon: detail });
          return;
        }

        if (platform === "KAKAO") {
          if (!url) {
            setPhase({ kind: "no_url", webtoon: detail });
            return;
          }
          setPhase({ kind: "kakao", webtoon: detail });
          return;
        }

        // Unknown platform: never iframe — surface external open if URL exists
        if (url) {
          setPhase({ kind: "naver", webtoon: detail });
          return;
        }
        setPhase({ kind: "no_url", webtoon: detail });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ToonaApiError
            ? err.message
            : "웹툰을 열 수 없어요.";
        setPhase({ kind: "error", message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [webtoonId]);

  const goHome = useCallback(() => {
    router.push("/home");
  }, [router]);

  if (phase.kind === "loading") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[#0a0a0a] text-white/70">
        <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
        <p className="text-[13px]">웹툰을 불러오는 중...</p>
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <CenteredFallback
        title="웹툰을 열 수 없어요."
        detail={phase.message}
        onBack={goHome}
      />
    );
  }

  if (phase.kind === "naver") {
    const url = phase.webtoon.officialUrl;
    const isNaver =
      normalizePlatform(phase.webtoon.platform) === "NAVER";
    return (
      <CenteredFallback
        title={
          isNaver
            ? "네이버웹툰은 공식 페이지에서 열어드릴게요."
            : "웹툰을 열 수 없어요."
        }
        detail={phase.webtoon.title}
        onBack={goHome}
        primaryLabel={
          url
            ? isNaver
              ? getOpenWebtoonCtaLabel("NAVER", {
                  isMobile,
                  officialUrl: url,
                })
              : "공식 사이트에서 보기"
            : undefined
        }
        onPrimary={
          url
            ? () =>
                isNaver
                  ? openNaverOfficial({
                      officialUrl: url,
                      webtoonId: phase.webtoon.id,
                    })
                  : openOfficialInNewTab(url)
            : undefined
        }
      />
    );
  }

  if (phase.kind === "no_url") {
    return (
      <CenteredFallback
        title="웹툰을 열 수 없어요."
        detail="공식 링크가 아직 준비되지 않았어요."
        onBack={goHome}
      />
    );
  }

  const { webtoon } = phase;
  const officialUrl = webtoon.officialUrl!;

  return (
    <div className="flex h-[100dvh] w-[100vw] flex-col overflow-hidden bg-[#0a0a0a] text-foreground">
      <header
        className="relative flex shrink-0 items-center border-b border-white/10 bg-[#0a0a0a] px-1"
        style={{ height: HEADER_H }}
      >
        <div className="z-10 flex shrink-0 items-center">
          <button
            type="button"
            aria-label="TOONA 홈으로"
            onClick={goHome}
            className="flex h-10 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="TOONA 홈"
            onClick={goHome}
            className="flex h-10 items-center rounded-md px-0.5 hover:opacity-90"
          >
            <ToonaLogo size="sm" className="!h-5 w-auto sm:!h-5 md:!h-5" />
          </button>
        </div>

        <p
          className="pointer-events-none absolute inset-x-24 truncate text-center text-[14px] font-semibold leading-none text-white"
          title={webtoon.title}
        >
          {webtoon.title}
        </p>

        <button
          type="button"
          onClick={() => openOfficialInNewTab(officialUrl)}
          className="z-10 ml-auto flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-medium text-white/85 hover:bg-white/10"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          <span>공식에서 열기</span>
        </button>
      </header>

      <div
        className="relative min-h-0 w-full flex-1 bg-white"
        style={{ height: `calc(100dvh - ${HEADER_H}px)` }}
      >
        {!iframeReady ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0a0a0a] text-white/60">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
            <p className="text-[12px]">웹툰을 불러오는 중...</p>
          </div>
        ) : null}
        <iframe
          title={`${webtoon.title} - 카카오웹툰`}
          src={officialUrl}
          className="h-full w-full border-0"
          allowFullScreen
          onLoad={() => setIframeReady(true)}
        />
      </div>
    </div>
  );
}

function CenteredFallback({
  title,
  detail,
  onBack,
  primaryLabel,
  onPrimary,
}: {
  title: string;
  detail?: string;
  onBack: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="text-[16px] font-semibold text-foreground">{title}</p>
      {detail ? (
        <p className="max-w-sm text-[13px] text-muted-foreground">{detail}</p>
      ) : null}
      <div className="flex w-full max-w-xs flex-col gap-2">
        {primaryLabel && onPrimary ? (
          <Button type="button" className="min-h-11 w-full" onClick={onPrimary}>
            <ExternalLink className="h-4 w-4" aria-hidden />
            {primaryLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full"
          onClick={onBack}
        >
          뒤로가기
        </Button>
      </div>
    </div>
  );
}
