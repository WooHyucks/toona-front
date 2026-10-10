"use client";

import { Button } from "@/components/ui/button";

type Props = {
  /** found = after confirm; similar = discovery after miss */
  variant: "found" | "similar";
  onOpenToonaPick: () => void;
};

export function FindDiscoveryCta({ variant, onOpenToonaPick }: Props) {
  if (variant === "found") {
    return (
      <div className="mt-12 border-t border-border pt-8">
        <p className="text-[16px] font-semibold tracking-[-0.02em] text-foreground">
          이 작품을 찾고 계셨군요.
        </p>
        <p className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-foreground">
          혹시 새로운 웹툰도 찾고 계신가요?
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          오늘 정주행하기 좋은 작품을
          <br />
          유저님 취향에 맞춰 골라드릴게요.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4 min-h-12 w-full text-[14px] font-semibold"
          onClick={onOpenToonaPick}
        >
          오늘의 투나픽 보기
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-border pt-8">
      <p className="text-[16px] font-semibold tracking-[-0.02em] text-foreground">
        찾던 작품 말고,
        <br />
        새로운 작품도 만나볼까요?
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        오늘 정주행하기 좋은 웹툰을
        <br />
        유저님 취향에 맞춰 골라드릴게요.
      </p>
      <Button
        type="button"
        className="mt-4 min-h-12 w-full text-[15px] font-semibold"
        onClick={onOpenToonaPick}
      >
        오늘의 투나픽 보기
      </Button>
    </div>
  );
}
