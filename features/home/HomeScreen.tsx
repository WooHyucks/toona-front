"use client";

import { DesktopContent } from "@/features/shell/DesktopContent";
import { RankingRail } from "@/features/rankings/components/RankingRail";
import type { HomeRail } from "@/features/rankings/model/ranking-utils";
import type { HomeBundle } from "@/lib/api/home";
import { FallbackHero, HeroSlider } from "@/features/home/HeroSlider";
import { RecentTasteResumeCard } from "@/features/home/RecentTasteResumeCard";
import { LifetimeWebtoonsSection } from "@/features/lifetime/LifetimeWebtoonsSection";
import { ToonaLogo } from "@/components/brand/ToonaLogo";
import Link from "next/link";
import { Bookmark, RotateCcw, Search } from "lucide-react";

function MobileHomeHeader() {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-1 flex items-center justify-between bg-background/90 px-4 py-3 backdrop-blur-md md:hidden">
      <Link href="/home" aria-label="Toona 홈">
        <ToonaLogo size="sm" priority />
      </Link>
      <div className="flex items-center gap-1.5">
        <Link
          href="/search"
          aria-label="검색"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search className="h-5 w-5" />
        </Link>
        <Link
          href="/onboarding"
          aria-label="취향 다시 설정"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-5 w-5" />
        </Link>
        <button
          type="button"
          aria-label="저장 (준비 중)"
          disabled
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-card text-muted-foreground/50"
        >
          <Bookmark className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function EmptyBrowse() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-[15px] font-medium text-foreground">
        아직 보여줄 작품이 없어요.
      </p>
      <p className="mt-2 text-[13px] text-muted-foreground">
        잠시 후 다시 확인해 주세요.
      </p>
    </div>
  );
}

export function ToonaHome({ hero, rails }: HomeBundle) {
  return (
    <div className="pb-24 md:pb-16">
      <DesktopContent>
        <MobileHomeHeader />

        {hero ? <HeroSlider hero={hero} /> : <FallbackHero />}

        <LifetimeWebtoonsSection />

        <RecentTasteResumeCard browseAnchorId="home-browse" />

        {/* 웹툰 이상형 월드컵 — 일시 비노출
        <Link
          href="/world-cup?mode=replay"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-elevated"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-[13px] font-bold text-primary">
            16
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-[14px] font-semibold text-foreground">
              웹툰 이상형 월드컵
            </span>
            <span className="mt-0.5 block text-[12px] text-muted-foreground">
              유명 웹툰 16강 · 약 2분
            </span>
          </span>
        </Link>
        */}

        <div id="home-browse" className="scroll-mt-20">
          {!hero && rails.length === 0 ? (
            <EmptyBrowse />
          ) : (
            rails.map((rail) => (
              <RankingRail
                key={rail.id}
                rail={
                  {
                    id: rail.id,
                    title: rail.title,
                    items: rail.items,
                  } as HomeRail
                }
                showPlatformRank={rail.id === "popular"}
              />
            ))
          )}
        </div>

        <div className="mt-10 hidden md:block">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            취향 다시 설정
          </Link>
        </div>
      </DesktopContent>
    </div>
  );
}

/** @deprecated */
export function HomeScreen(props: HomeBundle) {
  return <ToonaHome {...props} />;
}
