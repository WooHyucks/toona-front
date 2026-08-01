"use client";

import { useMemo, useState } from "react";
import { Search, SearchX, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import {
  MobileBottomCTA,
  PrimaryCTAButton,
} from "@/components/common/MobileBottomCTA";
import { FilterChips } from "@/components/search/FilterChips";
import { FilterDrawer, type FilterState } from "@/components/search/FilterDrawer";
import { WebtoonCard } from "@/components/webtoon/WebtoonCard";
import { ellipsis } from "@/lib/utils";
import {
  GENRE_LABELS,
  QUICK_GENRE_CHIPS,
  type Webtoon,
} from "@/types/webtoon";

type WebtoonSelectionStepProps = {
  webtoons: Webtoon[];
  selected: Webtoon | null;
  onSelect: (webtoon: Webtoon) => void;
  onConfirm: () => void;
};

const initialFilters: FilterState = {
  genres: [],
  platforms: [],
  statuses: [],
  days: [],
};

export function WebtoonSelectionStep({
  webtoons,
  selected,
  onSelect,
  onConfirm,
}: WebtoonSelectionStepProps) {
  const [query, setQuery] = useState("");
  const [quickGenre, setQuickGenre] = useState("전체");
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const activeFilterCount =
    filters.genres.length +
    filters.platforms.length +
    filters.statuses.length +
    filters.days.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return webtoons.filter((item) => {
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.author?.toLowerCase().includes(q) ?? false) ||
        (item.genre?.toLowerCase().includes(q) ?? false) ||
        (GENRE_LABELS[item.genre ?? ""] ?? "").includes(q);

      const matchesQuick =
        quickGenre === "전체" ||
        item.genre === quickGenre ||
        (quickGenre === "Historical" && item.genre === "Historical");

      const matchesGenre =
        filters.genres.length === 0 ||
        (item.genre ? filters.genres.includes(item.genre) : false);

      const matchesPlatform =
        filters.platforms.length === 0 ||
        filters.platforms.includes(item.platform);

      const matchesDay =
        filters.days.length === 0 ||
        filters.days.includes(item.day_of_week) ||
        filters.days.includes(item.day_of_week.toLowerCase());

      // status is mock — treat all as ongoing unless marked completed
      const status = item.status ?? "ongoing";
      const matchesStatus =
        filters.statuses.length === 0 || filters.statuses.includes(status);

      return (
        matchesQuery &&
        matchesQuick &&
        matchesGenre &&
        matchesPlatform &&
        matchesDay &&
        matchesStatus
      );
    });
  }, [webtoons, query, quickGenre, filters]);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-content flex-col">
      <div className="px-4 pb-3 pt-2 sm:px-6">
        <p className="mb-3 text-[1.15rem] font-extralight tracking-tight">
          toona.
        </p>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight sm:text-3xl">
          가장 재밌게 본
          <br />
          웹툰 하나를 골라주세요
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Toona가 취향을 분석해
          <br />
          다음으로 볼 작품을 찾아드릴게요.
        </p>
      </div>

      <div className="sticky top-0 z-20 space-y-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="웹툰 제목을 검색해보세요"
            className="h-12 pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <FilterChips
            items={QUICK_GENRE_CHIPS.map((chip) =>
              chip === "전체" ? "전체" : GENRE_LABELS[chip] ?? chip
            )}
            value={
              quickGenre === "전체"
                ? "전체"
                : GENRE_LABELS[quickGenre] ?? quickGenre
            }
            onChange={(label) => {
              if (label === "전체") {
                setQuickGenre("전체");
                return;
              }
              const entry = Object.entries(GENRE_LABELS).find(
                ([, v]) => v === label
              );
              setQuickGenre(entry?.[0] ?? label);
            }}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="relative shrink-0"
            aria-label="상세 필터"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 ? (
              <Badge className="absolute -right-1.5 -top-1.5 h-5 min-w-5 justify-center px-1">
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>
        </div>
      </div>

      <div
        className={`flex-1 px-4 pb-36 pt-4 sm:px-6 ${selected ? "pb-40" : "pb-8"}`}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="찾는 작품이 아직 없어요"
            description="다른 검색어나 필터로 다시 찾아보세요."
            actionLabel="초기 목록으로"
            onAction={() => {
              setQuery("");
              setQuickGenre("전체");
              setFilters(initialFilters);
            }}
          />
        ) : (
          <div className="grid grid-cols-3 gap-x-2.5 gap-y-5 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {filtered.map((webtoon) => (
              <WebtoonCard
                key={webtoon.id}
                webtoon={webtoon}
                selected={selected?.id === webtoon.id}
                dimmed={!!selected && selected.id !== webtoon.id}
                layoutId={
                  selected?.id === webtoon.id
                    ? `selected-${webtoon.id}`
                    : undefined
                }
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>

      <MobileBottomCTA visible={!!selected && !searchFocused}>
        <PrimaryCTAButton onClick={onConfirm}>
          {selected
            ? `${ellipsis(selected.title, 16)}으로 추천받기`
            : "이 웹툰으로 추천받기"}
        </PrimaryCTAButton>
      </MobileBottomCTA>

      <FilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filters}
        onChange={setFilters}
      />
    </div>
  );
}
