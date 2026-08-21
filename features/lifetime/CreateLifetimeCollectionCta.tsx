"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "@/lib/session";

type CreateLifetimeCollectionCtaProps = {
  sourceWebtoonId: string;
  sourceTitle: string;
  onSkipHome: () => void;
  skipLabel: string;
};

export function CreateLifetimeCollectionCta({
  sourceWebtoonId,
  sourceTitle,
  onSkipHome,
  skipLabel,
}: CreateLifetimeCollectionCtaProps) {
  const router = useRouter();

  function goGetMoreRecs() {
    if (sourceWebtoonId) {
      completeOnboarding(sourceWebtoonId, sourceTitle);
    }
    router.push("/home");
  }

  return (
    <div className="rounded-2xl bg-card px-4 py-5">
      <p className="text-[15px] font-semibold text-foreground">
        이 취향으로 더 찾아볼까요?
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        홈에서 {sourceTitle}과 비슷한 작품을 이어서 추천받을 수 있어요.
      </p>
      <Button
        type="button"
        className="mt-4 min-h-12 w-full rounded-2xl text-[15px] font-semibold hover:bg-primary hover:text-primary-foreground"
        onClick={goGetMoreRecs}
      >
        더 많은 웹툰 추천 받기
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
      <button
        type="button"
        onClick={onSkipHome}
        className="mt-2 w-full py-1.5 text-[12px] text-muted-foreground/70"
      >
        {skipLabel}
      </button>
    </div>
  );
}
