"use client";

import Link from "next/link";
import { Bookmark, ExternalLink, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/webtoon/PlatformBadge";
import {
  getMockDescription,
  getTasteKeywords,
  type Webtoon,
} from "@/types/webtoon";

type HomeHeroProps = {
  webtoon: Webtoon;
  onOpen: (webtoon: Webtoon) => void;
  onToggleSave?: () => void;
  saved?: boolean;
};

export function HomeHero({
  webtoon,
  onOpen,
  onToggleSave,
  saved,
}: HomeHeroProps) {
  const keywords = getTasteKeywords(webtoon);

  return (
    <section className="px-4 sm:px-6">
      <div className="overflow-hidden rounded-[20px] bg-card ring-1 ring-border">
        <button
          type="button"
          className="relative block w-full text-left"
          onClick={() => onOpen(webtoon)}
        >
          <div className="relative aspect-[4/5] max-h-[420px] overflow-hidden bg-muted sm:aspect-[16/10]">
            {webtoon.thumb_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={webtoon.thumb_url}
                alt={webtoon.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-top"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 text-white">
              <PlatformBadge platform={webtoon.platform} size="md" />
              <h1 className="text-2xl font-semibold tracking-tight">
                {webtoon.title}
              </h1>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    className="border-0 bg-white/15 text-white"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
              <p className="line-clamp-2 text-[15px] text-white/85">
                {getMockDescription(webtoon)}
              </p>
            </div>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-2 p-3">
          <Button asChild className="h-12">
            <a
              href={webtoon.link ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              작품 보러 가기
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="secondary" className="h-12">
            <Link href={`/recommendations?source=${webtoon.id}`}>
              <WandSparkles className="h-4 w-4" />
              비슷한 작품 찾기
            </Link>
          </Button>
        </div>
        {onToggleSave ? (
          <div className="px-3 pb-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={onToggleSave}
            >
              <Bookmark className={saved ? "fill-current" : undefined} />
              {saved ? "저장됨" : "저장하기"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
