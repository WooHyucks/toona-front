"use client";

import { formatRoundProgress, tournamentBar } from "@/lib/world-cup-round";
import { cn } from "@/lib/utils";
import type { WorldCupMatch, WorldCupTournament } from "@/types/api";

type WorldCupProgressProps = {
  match: WorldCupMatch;
  tournament: WorldCupTournament;
  className?: string;
};

/** Compact header bar — round label lives above the question instead. */
export function WorldCupProgressBar({
  match,
  tournament,
  className,
}: WorldCupProgressProps) {
  const bar = tournamentBar(tournament);
  const roundText = formatRoundProgress({
    round: match.round,
    matchIndex: match.matchIndex,
  });

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-center justify-end">
        <span className="text-[12px] font-semibold tabular-nums text-muted-foreground sm:text-[13px]">
          {bar.completed}
          <span className="font-medium text-muted-foreground/70">
            {" "}
            / {bar.total}
          </span>
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-elevated"
        role="progressbar"
        aria-valuenow={bar.completed}
        aria-valuemin={0}
        aria-valuemax={bar.total}
        aria-label={`${roundText}, 경기 진행 ${bar.completed} of ${bar.total}`}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `${bar.ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
