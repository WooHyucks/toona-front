"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FindConfirmedWebtoon } from "@/types/api";
import { FindCover } from "./FindCover";
import { FindDiscoveryCta } from "./FindDiscoveryCta";
import { findPlatformLabel } from "./platform";

type Props = {
  webtoon: FindConfirmedWebtoon;
  onOfficialClick: () => void;
  onOpenToonaPick: () => void;
  onReset: () => void;
};

export function FindFound({
  webtoon,
  onOfficialClick,
  onOpenToonaPick,
  onReset,
}: Props) {
  const platform = findPlatformLabel(webtoon.platform);
  const officialUrl = webtoon.officialUrl?.trim() || null;

  return (
    <div className="mx-auto w-full max-w-xl">
      <p className="text-center text-[15px] font-semibold text-success">
        찾았어요 🙌
      </p>

      <FindCover
        src={webtoon.thumbnailUrl}
        title={webtoon.title}
        priority
        className="mx-auto mt-5 aspect-[2/3] w-[168px] md:w-[200px]"
      />

      <h2 className="mt-5 text-center text-[24px] font-bold leading-snug tracking-[-0.03em] text-foreground md:text-[28px]">
        {webtoon.title}
      </h2>
      {platform ? (
        <p className="mt-1 text-center text-[13px] text-muted-foreground">
          {platform}
        </p>
      ) : null}

      {officialUrl ? (
        <Button asChild className="mt-6 min-h-12 w-full text-[15px] font-semibold">
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${webtoon.title} 웹툰 보러가기, 새 탭`}
            onClick={onOfficialClick}
          >
            웹툰 보러가기
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </Button>
      ) : null}

      <FindDiscoveryCta variant="found" onOpenToonaPick={onOpenToonaPick} />

      <button
        type="button"
        onClick={onReset}
        className="mt-6 text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        다른 웹툰 찾기
      </button>
    </div>
  );
}
