"use client";

import { useRouter } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  GenreChip,
  PlatformBadge,
} from "@/features/webtoons/components/PlatformBadge";
import {
  DAY_LABEL,
  GENRE_LABELS,
  type Webtoon,
} from "@/features/webtoons/model";
import { prepareTasteAnalysis } from "@/lib/taste-flow";

type WebtoonDetailDrawerProps = {
  webtoon: Webtoon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (webtoon: Webtoon) => void;
  selected?: boolean;
};

export function WebtoonDetailDrawer({
  webtoon,
  open,
  onOpenChange,
  onSelect,
  selected = false,
}: WebtoonDetailDrawerProps) {
  const router = useRouter();

  if (!webtoon) return null;

  const coverSrc = webtoon.thumbnailUrl;
  const genreLabel = webtoon.primaryGenre
    ? GENRE_LABELS[webtoon.primaryGenre]
    : null;
  const dayLabel = webtoon.primaryDay
    ? DAY_LABEL[webtoon.primaryDay]
    : null;

  const handleRecommend = () => {
    if (!selected) onSelect?.(webtoon);
    onOpenChange(false);
    router.push(
      prepareTasteAnalysis(webtoon.id, webtoon.title, {
        origin: "HOME",
        source: "home",
        thumbnailUrl: webtoon.thumbnailUrl,
        platform: webtoon.platform,
      })
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-app border-t-0">
        <div className="relative flex-1 overflow-y-auto px-5 pb-2 pt-2">
          <DrawerClose asChild>
            <button
              type="button"
              className="absolute right-5 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-muted-foreground transition-colors hover:text-foreground"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </DrawerClose>

          <div className="flex gap-4 pr-10">
            <div className="relative h-[120px] w-[80px] shrink-0 overflow-hidden rounded-xl bg-elevated">
              <WebtoonCover src={coverSrc} fill className="object-cover" />
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <DrawerTitle className="text-[17px] font-bold leading-snug">
                {webtoon.title}
              </DrawerTitle>
              {webtoon.author ? (
                <DrawerDescription className="mt-1 text-[13px]">
                  {webtoon.author}
                </DrawerDescription>
              ) : null}

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <PlatformBadge platform={webtoon.platform} />
                {genreLabel ? <GenreChip label={genreLabel} /> : null}
                {dayLabel ? <GenreChip label={dayLabel} /> : null}
              </div>
            </div>
          </div>

          {webtoon.description ? (
            <>
              <div className="my-4 h-px bg-border" />
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  줄거리
                </p>
                <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-5">
                  {webtoon.description}
                </p>
              </div>
            </>
          ) : null}
        </div>

        <DrawerFooter className="bg-card">
          <Button
            className="h-[52px] w-full gap-2 text-[15px] font-semibold"
            onClick={handleRecommend}
          >
            <Sparkles className="h-4 w-4" />
            이 작품으로 추천받기
          </Button>
          <Button
            variant="outline"
            className="h-[48px] w-full border-border bg-elevated text-[14px] font-medium text-muted-foreground hover:bg-elevated hover:text-foreground"
            onClick={() => {
              onSelect?.(webtoon);
              onOpenChange(false);
            }}
          >
            {selected ? "선택 해제" : "선택만 하기"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
