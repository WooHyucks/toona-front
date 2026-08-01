"use client";

import Link from "next/link";
import {
  Bookmark,
  CalendarDays,
  ExternalLink,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PlatformBadge } from "@/components/webtoon/PlatformBadge";
import {
  DAY_LABELS,
  getGenreLabel,
  getMockDescription,
  type Webtoon,
} from "@/types/webtoon";

type WebtoonDetailSheetProps = {
  webtoon: Webtoon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saved?: boolean;
  onToggleSave?: () => void;
};

export function WebtoonDetailSheet({
  webtoon,
  open,
  onOpenChange,
  saved = false,
  onToggleSave,
}: WebtoonDetailSheetProps) {
  if (!webtoon) return null;

  const day =
    DAY_LABELS[webtoon.day_of_week] ??
    DAY_LABELS[webtoon.day_of_week.toLowerCase()] ??
    webtoon.day_of_week;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <div className="overflow-y-auto px-5 pb-2">
          <div className="mx-auto mt-2 aspect-[2/3] max-w-[220px] overflow-hidden rounded-[18px] bg-muted">
            {webtoon.thumb_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={webtoon.thumb_url}
                alt={webtoon.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <DrawerHeader className="px-0">
            <div className="mb-2 flex items-center gap-2">
              <PlatformBadge platform={webtoon.platform} size="md" />
              <Badge variant="secondary">{getGenreLabel(webtoon.genre)}</Badge>
            </div>
            <DrawerTitle className="text-2xl">{webtoon.title}</DrawerTitle>
            <DrawerDescription className="text-[15px]">
              {webtoon.author ?? "작가 미상"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {day} 연재
          </div>

          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {getMockDescription(webtoon)}
          </p>
        </div>

        <DrawerFooter>
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
              <Bookmark className={saved ? "fill-current" : undefined} />
              저장
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link
                href={`/recommendations?source=${webtoon.id}`}
                onClick={() => onOpenChange(false)}
              >
                <WandSparkles className="h-4 w-4" />
                비슷한 작품 찾기
              </Link>
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
