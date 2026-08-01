"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import {
  MobileBottomCTA,
  PrimaryCTAButton,
} from "@/components/common/MobileBottomCTA";
import { ellipsis } from "@/lib/utils";
import { prepareTasteAnalysis } from "@/lib/taste-flow";
import type { Webtoon } from "@/features/webtoons/model";

type SelectedWebtoonCTAProps = {
  webtoon: Webtoon | null;
  visible: boolean;
};

export function SelectedWebtoonCTA({
  webtoon,
  visible,
}: SelectedWebtoonCTAProps) {
  const router = useRouter();

  if (!webtoon) return null;

  return (
    <MobileBottomCTA visible={visible}>
      <div className="space-y-2">
        <p className="truncate text-center text-xs text-muted-foreground">
          {ellipsis(webtoon.title, 24)}
        </p>
        <PrimaryCTAButton
          className="gap-2"
          onClick={() =>
            router.push(
              prepareTasteAnalysis(webtoon.id, webtoon.title, {
                origin: "HOME",
                source: "home",
                thumbnailUrl: webtoon.thumbnailUrl,
                platform: webtoon.platform,
              })
            )
          }
        >
          <Sparkles className="h-4 w-4" />
          이 작품으로 추천받기
        </PrimaryCTAButton>
      </div>
    </MobileBottomCTA>
  );
}
