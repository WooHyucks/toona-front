"use client";

import Link from "next/link";
import { ToonaLogo } from "@/components/brand/ToonaLogo";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import { WebtoonThumbnail } from "@/features/webtoons/components/WebtoonThumbnail";
import { toUiPlatform } from "@/lib/api/mappers";
import { getEpisodeLabel } from "@/lib/episode";
import type { WorldCupWebtoon } from "@/types/api";
import { motion } from "framer-motion";
import { Home, Loader2, Trophy } from "lucide-react";

type WorldCupWinnerProps = {
  winner: WorldCupWebtoon;
  continuing: boolean;
  restarting: boolean;
  onSimilar: () => void;
  onRestart: () => void;
};

export function WorldCupWinnerView({
  winner,
  continuing,
  restarting,
  onSimilar,
  onRestart,
}: WorldCupWinnerProps) {
  const platform = toUiPlatform(String(winner.platform ?? "NAVER"));
  const episode = getEpisodeLabel({
    status: winner.status,
    latestEpisodeNumber: winner.latestEpisodeNumber,
    totalEpisodeCount: winner.totalEpisodeCount,
  });
  const longTitle = winner.title.length > 12;
  const cta = longTitle
    ? "비슷한 웹툰 보기"
    : `${winner.title}과 비슷한 웹툰 보기`;

  return (
    <motion.div
      className="mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 md:max-w-xl md:px-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="relative flex items-center justify-center">
        <ToonaLogo size="sm" />
        <Link
          href="/home"
          aria-label="홈으로"
          className="absolute right-0 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Home className="h-[18px] w-[18px]" aria-hidden />
        </Link>
      </div>

      <div className="mt-8 flex flex-1 flex-col items-center text-center">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-card ring-1 ring-border">
          <Trophy className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <p className="text-[14px] text-muted-foreground">당신의 최애 웹툰은</p>
        <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-[30px]">
          {winner.title}이군요
        </h1>

        <div className="mt-8 w-[42%] max-w-[180px]">
          <WebtoonThumbnail
            src={winner.thumbnailUrl}
            title={winner.title}
            platform={platform}
            priority
            seed={winner.id}
            className="rounded-2xl shadow-lg shadow-black/30"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          <PlatformBadge platform={platform} size="sm" />
          {episode ? (
            <span className="text-[12px] text-muted-foreground">{episode}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-8 space-y-2.5">
        <Button
          type="button"
          className="w-full"
          disabled={continuing || restarting}
          onClick={onSimilar}
        >
          {continuing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              이동 중
            </>
          ) : (
            cta
          )}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={continuing || restarting}
          onClick={onRestart}
        >
          {restarting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              다시 준비 중
            </>
          ) : (
            "다시 하기"
          )}
        </Button>
        <Button
          asChild
          variant="ghost"
          className="w-full"
          disabled={continuing || restarting}
        >
          <Link href="/home">
            <Home className="h-4 w-4" aria-hidden />
            홈으로
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
