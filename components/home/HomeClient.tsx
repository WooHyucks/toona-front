"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { ErrorState } from "@/components/common/ErrorState";
import { ContentRail } from "@/components/home/ContentRail";
import { HomeHero } from "@/components/home/HomeHero";
import { MobileBottomNavigation } from "@/components/home/MobileBottomNavigation";
import { WebtoonDetailSheet } from "@/components/webtoon/WebtoonDetailSheet";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useSavedWebtoons } from "@/hooks/useSavedWebtoons";
import { getDayLabel, type Webtoon } from "@/types/webtoon";

type HomeClientProps = {
  webtoons: Webtoon[];
  error?: boolean;
};

export function HomeClient({ webtoons, error }: HomeClientProps) {
  const { sourceId } = useOnboardingStatus();
  const { isSaved, toggleSave } = useSavedWebtoons();
  const [selected, setSelected] = useState<Webtoon | null>(null);

  const source = useMemo(
    () => webtoons.find((w) => w.id === sourceId) ?? null,
    [sourceId, webtoons]
  );

  const rails = useMemo(() => {
    const byGenre = (genre: string) =>
      webtoons.filter((w) => w.genre === genre).slice(0, 24);
    const byPlatform = (platform: string) =>
      webtoons.filter((w) => w.platform === platform).slice(0, 24);
    const todayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
      new Date().getDay()
    ];

    const similar = source
      ? webtoons
          .filter((w) => w.genre === source.genre && w.id !== source.id)
          .slice(0, 24)
      : [];

    return [
      {
        title: "Toona에서 지금 인기 있는 웹툰",
        items: webtoons.slice(0, 24),
      },
      source
        ? {
            title: `${source.title}을 좋아한 당신에게`,
            items: similar,
          }
        : {
            title: "당신이 고른 작품과 비슷한 웹툰",
            items: webtoons.filter((w) => w.genre === "Fantasy").slice(0, 24),
          },
      {
        title: "이번 주 새로 뜨는 작품",
        items: [...webtoons].reverse().slice(0, 24),
      },
      {
        title: "완결작 정주행 추천",
        items: webtoons.filter((w) => (w.rank ?? 99) <= 5).slice(0, 24),
      },
      { title: "판타지 인기작", items: byGenre("Fantasy") },
      { title: "로맨스 인기작", items: byGenre("Romance") },
      { title: "무협·사극 인기작", items: byGenre("Historical") },
      { title: "네이버웹툰 인기작", items: byPlatform("naver") },
      { title: "카카오웹툰 인기작", items: byPlatform("kakao") },
      {
        title: `오늘 연재되는 웹툰 (${getDayLabel(todayKey)})`,
        items: webtoons
          .filter((w) => w.day_of_week.toLowerCase() === todayKey)
          .slice(0, 24),
      },
    ].filter((rail) => rail.items.length > 0);
  }, [source, webtoons]);

  const hero = source ?? webtoons[0] ?? null;

  if (error) {
    return (
      <div className="min-h-[100dvh]">
        <AppHeader showSearch showMy />
        <ErrorState title="홈 콘텐츠를 불러오지 못했어요" />
        <MobileBottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-24 md:pb-10">
      <AppHeader showSearch showMy />

      <div className="mx-auto max-w-content space-y-8 py-4">
        {hero ? (
          <HomeHero
            webtoon={hero}
            onOpen={setSelected}
            saved={isSaved(hero.id)}
            onToggleSave={() => toggleSave(hero.id)}
          />
        ) : null}

        {rails.map((rail) => (
          <ContentRail
            key={rail.title}
            title={rail.title}
            webtoons={rail.items}
            onOpen={setSelected}
          />
        ))}
      </div>

      <WebtoonDetailSheet
        webtoon={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        saved={selected ? isSaved(selected.id) : false}
        onToggleSave={() => selected && toggleSave(selected.id)}
      />

      <MobileBottomNavigation />
    </div>
  );
}
