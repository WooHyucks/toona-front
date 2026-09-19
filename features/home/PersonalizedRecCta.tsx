"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { trackPersonalizedRecommendationCtaClick } from "@/lib/analytics";
import { getVisitorType } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  compact?: boolean;
  className?: string;
};

function goPersonalize(router: ReturnType<typeof useRouter>) {
  trackPersonalizedRecommendationCtaClick({
    visitorType: getVisitorType(),
  });
  router.push("/onboarding");
}

export function PersonalizedRecCta({ compact = false, className }: Props) {
  const router = useRouter();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => goPersonalize(router)}
        className={cn(
          "mt-4 flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left",
          className
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-foreground">
            뭘 볼지 모르겠다면?
          </span>
          <span className="mt-0.5 block text-[12px] text-muted-foreground">
            재밌게 본 웹툰 하나로 다음 작품 3개를 골라드려요
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-primary">
          추천받기
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] bg-card px-5 py-6 ring-1 ring-white/[0.06] md:rounded-[28px] md:px-8 md:py-8",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(80% 60% at 80% 0%, rgba(95,52,254,0.22) 0%, transparent 55%)",
        }}
      />
      <p className="relative text-[13px] font-medium text-muted-foreground">
        TOONA
      </p>
      <h2 className="relative mt-2 text-[22px] font-bold tracking-[-0.03em] text-foreground md:text-[28px]">
        뭘 볼지 모르겠다면?
      </h2>
      <p className="relative mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
        재밌게 본 웹툰 하나만 골라주세요.
        <br />
        취향에 맞는 다음 웹툰 3개를 추천해드릴게요.
      </p>
      <Button
        type="button"
        className="relative mt-5 min-h-12 w-full rounded-2xl text-[15px] font-semibold md:max-w-sm"
        onClick={() => goPersonalize(router)}
      >
        내 취향 웹툰 3개 추천받기
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
      <p className="relative mt-3 text-[12px] text-muted-foreground">
        추천 없이도 아래에서 인기·장르별 작품을 둘러볼 수 있어요.
      </p>
    </div>
  );
}
