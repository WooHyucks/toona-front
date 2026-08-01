"use client";

import Link from "next/link";
import { ToonaLogo } from "@/components/brand/ToonaLogo";
import { WorldCupProgressBar } from "@/features/world-cup/components/WorldCupProgress";
import { WorldCupWebtoonCard } from "@/features/world-cup/components/WorldCupWebtoonCard";
import { formatRoundProgress } from "@/lib/world-cup-round";
import type {
  WorldCupChoiceAction,
  WorldCupMatch,
  WorldCupTournament,
} from "@/types/api";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Home, Loader2 } from "lucide-react";

type WorldCupMatchViewProps = {
  title: string;
  match: WorldCupMatch;
  tournament: WorldCupTournament;
  submitting: boolean;
  highlight: "left" | "right" | null;
  roundBanner: string | null;
  onChoice: (action: WorldCupChoiceAction) => void;
};

export function WorldCupMatchView({
  match,
  tournament,
  submitting,
  highlight,
  roundBanner,
  onChoice,
}: WorldCupMatchViewProps) {
  const reduceMotion = useReducedMotion();
  const showUnknown = match.round === "ROUND_OF_16";
  const roundText = formatRoundProgress({
    round: match.round,
    matchIndex: match.matchIndex,
  });

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-4 md:max-w-xl md:px-6">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/home" aria-label="Toona 홈" className="shrink-0">
          <ToonaLogo size="sm" priority />
        </Link>
        <div className="min-w-0 flex-1">
          <WorldCupProgressBar match={match} tournament={tournament} />
        </div>
        <Link
          href="/home"
          aria-label="홈으로"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Home className="h-[18px] w-[18px]" aria-hidden />
        </Link>
      </header>

      <AnimatePresence mode="wait">
        {roundBanner ? (
          <motion.p
            key={roundBanner}
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-2 text-center text-[13px] font-semibold text-primary"
          >
            {roundBanner}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <p className="text-center text-[22px] font-bold leading-none tracking-[-0.03em] text-foreground sm:text-[24px]">
        {roundText}
      </p>
      <h1 className="mt-2.5 text-center text-[16px] font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-[17px]">
        둘 중 더 재밌게 본 작품은?
      </h1>
      {showUnknown ? (
        <p className="mt-1.5 text-center text-[12px] text-muted-foreground">
          모르는 작품은 건너뛰어도 괜찮아요.
        </p>
      ) : (
        <div className="mt-1.5 h-[18px]" aria-hidden />
      )}

      <div className="relative mt-5 flex flex-1 items-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={match.matchId}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="grid w-full grid-cols-2 gap-2.5 sm:gap-4"
          >
            <WorldCupWebtoonCard
              webtoon={match.left}
              side="left"
              disabled={submitting}
              highlighted={highlight === "left"}
              dimmed={highlight === "right"}
              onSelect={() => onChoice("SELECTED_LEFT")}
            />
            <WorldCupWebtoonCard
              webtoon={match.right}
              side="right"
              disabled={submitting}
              highlighted={highlight === "right"}
              dimmed={highlight === "left"}
              onSelect={() => onChoice("SELECTED_RIGHT")}
            />
          </motion.div>
        </AnimatePresence>

        <span
          className="pointer-events-none absolute left-1/2 top-[28%] z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/90 px-2 py-1 text-[11px] font-bold tracking-wide text-muted-foreground ring-1 ring-border sm:text-[12px]"
          aria-hidden
        >
          VS
        </span>
      </div>

      {showUnknown ? (
        <div className="mt-5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => onChoice("UNKNOWN_BOTH")}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[14px] font-semibold text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            {submitting && highlight === null ? (
              <Loader2
                className="h-4 w-4 animate-spin text-primary"
                aria-hidden
              />
            ) : null}
            둘 다 안 봤어요
          </button>
        </div>
      ) : (
        <div className="mt-5 h-12" aria-hidden />
      )}
    </div>
  );
}
