"use client";

import Link from "next/link";
import { Compass, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RecommendationCard } from "@/components/webtoon/RecommendationCard";
import { useSavedWebtoons } from "@/hooks/useSavedWebtoons";
import { useState } from "react";
import type { Webtoon } from "@/types/webtoon";

type RecommendationResultStepProps = {
  source: Webtoon;
  recommendations: Webtoon[];
};

export function RecommendationResultStep({
  source,
  recommendations,
}: RecommendationResultStepProps) {
  const { isSaved, toggleSave } = useSavedWebtoons();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app px-4 pb-16 pt-8 sm:max-w-content sm:px-6">
      <div className="mb-8 space-y-2">
        <p className="inline-flex items-center gap-1.5 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          Toona 추천
        </p>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight">
          가장 먼저 추천하고 싶은
          <br />
          두 작품이에요
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          분위기와 전개, 몰입감이 가장 비슷한 작품을 골랐어요.
        </p>
      </div>

      <div className="space-y-5">
        {recommendations.map((webtoon, index) => (
          <RecommendationCard
            key={webtoon.id}
            webtoon={webtoon}
            source={source}
            index={index}
            saved={isSaved(webtoon.id)}
            onToggleSave={() => toggleSave(webtoon.id)}
          />
        ))}
      </div>

      <div className="mt-10 space-y-3">
        <Button asChild className="h-[54px] w-full text-[15px] font-semibold">
          <Link href="/home">
            <Compass className="h-4 w-4" />
            인기 웹툰 한곳에서 보러 가기
          </Link>
        </Button>
        <Button asChild variant="secondary" className="h-12 w-full">
          <Link href="/onboarding">
            <RotateCcw className="h-4 w-4" />
            다른 웹툰으로 다시 추천받기
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-full"
          onClick={() => setLoginOpen(true)}
        >
          내 추천 저장하고 시작하기
        </Button>
      </div>

      <Drawer open={loginOpen} onOpenChange={setLoginOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>로그인이 필요해요</DrawerTitle>
            <DrawerDescription>
              추천을 저장하려면 계정이 필요해요. 지금은 미리보기로 이용할 수
              있어요.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button onClick={() => setLoginOpen(false)}>나중에 할게요</Button>
            <Button asChild variant="secondary">
              <Link href="/home" onClick={() => setLoginOpen(false)}>
                홈으로 계속하기
              </Link>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
