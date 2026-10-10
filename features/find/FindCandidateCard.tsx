"use client";

import { Button } from "@/components/ui/button";
import type { FindCandidate } from "@/types/api";
import { FindCover } from "./FindCover";
import { findPlatformLabel } from "./platform";

type Props = {
  candidate: FindCandidate;
  disabled?: boolean;
  priority?: boolean;
  onConfirm: (candidateId: string) => void;
  onReject: (candidateId: string) => void;
};

export function FindCandidateCard({
  candidate,
  disabled,
  priority,
  onConfirm,
  onReject,
}: Props) {
  const platform = findPlatformLabel(candidate.platform);
  const reason = candidate.reason?.trim() ?? "";

  return (
    <article className="flex gap-3 rounded-2xl border border-border bg-card p-3.5 md:flex-col md:p-4">
      <FindCover
        src={candidate.thumbnailUrl}
        title={candidate.title}
        priority={priority}
        className="h-[168px] w-[112px] shrink-0 md:h-auto md:w-full md:aspect-[2/3]"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-[16px] font-bold leading-snug tracking-[-0.02em] text-foreground md:text-[17px]">
          {candidate.title}
        </h3>
        {platform ? (
          <p className="mt-1 text-[12px] font-medium text-muted-foreground">
            {platform}
          </p>
        ) : null}
        {reason ? (
          <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-muted-foreground">
            {reason}
          </p>
        ) : null}
        <div className="mt-auto flex flex-col gap-2 pt-3">
          <Button
            type="button"
            className="min-h-11 w-full text-[14px] font-semibold"
            disabled={disabled}
            aria-label={`${candidate.title} 맞아요`}
            onClick={() => onConfirm(candidate.id)}
          >
            이거 맞아요
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-10 w-full text-[13px] font-medium text-muted-foreground"
            disabled={disabled}
            aria-label={`${candidate.title} 아니에요`}
            onClick={() => onReject(candidate.id)}
          >
            아니에요
          </Button>
        </div>
      </div>
    </article>
  );
}
