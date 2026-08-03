"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { recommendationShareUrl } from "@/lib/recommendations-path";
import { shareRecommendationResult } from "@/lib/share/recommendation";

type RecommendationShareButtonProps = {
  sourceWebtoonId: string;
  sourceTitle: string;
};

export function RecommendationShareButton({
  sourceWebtoonId,
  sourceTitle,
}: RecommendationShareButtonProps) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  async function onShare() {
    if (busy) return;
    setBusy(true);

    const shareUrl = recommendationShareUrl(sourceWebtoonId);
    const outcome = await shareRecommendationResult({
      sourceTitle,
      sourceWebtoonId,
      shareUrl,
    });

    if (outcome === "shared" || outcome === "copied") {
      track("recommendation_share_clicked", {
        sourceWebtoonId,
        sourceTitle,
        shareMethod: outcome === "shared" ? "native" : "clipboard",
        source: "recommendation_result",
      });
    }

    if (outcome === "copied") {
      showToast("친구에게 보낼 링크를 복사했어요.");
    } else if (outcome === "failed") {
      showToast("링크를 복사하지 못했어요. 주소창에서 복사해 주세요.");
    }

    setBusy(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 w-full rounded-xl text-[13px] font-semibold"
        onClick={() => void onShare()}
        disabled={busy}
        aria-label={`${sourceTitle} 추천 결과를 친구에게 공유하기`}
        aria-busy={busy}
      >
        <Share2 className="h-4 w-4" aria-hidden />
        친구에게 추천 결과 공유하기
      </Button>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-medium text-background shadow-lg md:bottom-8"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
