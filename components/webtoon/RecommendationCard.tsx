"use client";

import Link from "next/link";
import {
  Bookmark,
  ChevronRight,
  ExternalLink,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/webtoon/PlatformBadge";
import {
  getRecommendationReason,
  getTasteKeywords,
  type Webtoon,
} from "@/types/webtoon";
import { cn } from "@/lib/utils";

type RecommendationCardProps = {
  webtoon: Webtoon;
  source: Webtoon;
  index: number;
  saved?: boolean;
  onToggleSave?: () => void;
  className?: string;
};

export function RecommendationCard({
  webtoon,
  source,
  index,
  saved = false,
  onToggleSave,
  className,
}: RecommendationCardProps) {
  const keywords = getTasteKeywords(webtoon);
  const reason = getRecommendationReason(source, webtoon, index);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[20px] border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="relative mx-auto aspect-[2/3] max-w-[280px] overflow-hidden rounded-[18px] bg-muted">
        {webtoon.thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={webtoon.thumb_url}
            alt={webtoon.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute left-3 top-3">
          <PlatformBadge platform={webtoon.platform} size="md" />
        </div>
        {index === 0 ? (
          <div className="absolute right-3 top-3">
            <Badge variant="soft">가장 잘 맞는 작품</Badge>
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <h3 className="text-xl font-semibold tracking-tight">{webtoon.title}</h3>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((keyword) => (
            <Badge key={keyword} variant="secondary">
              {keyword}
            </Badge>
          ))}
        </div>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {reason}
        </p>

        <div className="flex flex-col gap-2 pt-1">
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
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-12"
              onClick={onToggleSave}
            >
              <Bookmark
                className={cn("h-4 w-4", saved && "fill-current")}
              />
              저장
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link href={`/recommendations?source=${webtoon.id}`}>
                <WandSparkles className="h-4 w-4" />
                비슷한 작품
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
