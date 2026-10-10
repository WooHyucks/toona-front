"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FindCandidate } from "@/types/api";
import { FindCover } from "./FindCover";
import { findPlatformLabel } from "./platform";

type Props = {
  item: FindCandidate;
  onOfficialClick?: () => void;
};

export function FindSimilarHero({ item, onOfficialClick }: Props) {
  const platform = findPlatformLabel(item.platform);
  const reason = item.reason?.trim() ?? "";
  const officialUrl = item.officialUrl?.trim() || null;

  return (
    <article className="mx-auto w-full max-w-md">
      <FindCover
        src={item.thumbnailUrl}
        title={item.title}
        priority
        className="mx-auto aspect-[2/3] w-[180px] md:w-[220px]"
      />
      <h3 className="mt-5 text-center text-[22px] font-bold leading-snug tracking-[-0.03em] text-foreground md:text-[24px]">
        {item.title}
      </h3>
      {platform ? (
        <p className="mt-1 text-center text-[13px] text-muted-foreground">
          {platform}
        </p>
      ) : null}
      {reason ? (
        <p className="mt-3 text-center text-[14px] leading-relaxed text-muted-foreground">
          {reason}
        </p>
      ) : null}
      {officialUrl ? (
        <Button asChild className="mt-5 min-h-12 w-full text-[15px] font-semibold">
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title} 웹툰 보러가기, 새 탭`}
            onClick={onOfficialClick}
          >
            웹툰 보러가기
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </Button>
      ) : null}
    </article>
  );
}
