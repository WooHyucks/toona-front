"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SearchX, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { GenreChips } from "@/features/onboarding/components/GenreChips";
import {
  WebtoonFilterDrawer,
  type DetailFilterState,
} from "@/features/onboarding/components/WebtoonFilterDrawer";
import { WebtoonDetailDrawer } from "@/features/webtoons/components/WebtoonDetailDrawer";
import { WebtoonSelectionCard } from "@/features/webtoons/components/WebtoonCards";
import { DesktopContent } from "@/features/shell/DesktopContent";
import {
  countActiveFilters,
  filterWebtoons,
  type ToonaGenre,
  type Webtoon,
} from "@/features/webtoons/model";
import { prepareTasteAnalysis } from "@/lib/taste-flow";

type WebtoonSelectionScreenProps = {
  webtoons: Webtoon[];
  error?: boolean;
  onRetry?: () => void;
};

const emptyDetailFilters: DetailFilterState = {
  platforms: [],
  genres: [],
  days: [],
  statuses: [],
};

export function WebtoonSelectionScreen({
  webtoons,
  error = false,
  onRetry,
}: WebtoonSelectionScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillId = searchParams.get("prefill");

  const [searchQuery, setSearchQuery] = useState("");
  const [quickGenre, setQuickGenre] = useState<ToonaGenre | "all">("all");
  const [detailFilters, setDetailFilters] =
    useState<DetailFilterState>(emptyDetailFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [detailWebtoon, setDetailWebtoon] = useState<Webtoon | null>(null);

  const initialSelected = useMemo(
    () => webtoons.find((w) => w.id === prefillId) ?? null,
    [prefillId, webtoons]
  );
  const [selectedWebtoon, setSelectedWebtoon] = useState<Webtoon | null>(
    initialSelected
  );

  const activeFilterCount = countActiveFilters({
    searchQuery: "",
    quickGenre: "all",
    ...detailFilters,
  });

  const filtered = useMemo(
    () =>
      filterWebtoons(webtoons, {
        searchQuery,
        quickGenre,
        ...detailFilters,
      }),
    [webtoons, searchQuery, quickGenre, detailFilters]
  );

  const resetFilters = () => {
    setSearchQuery("");
    setQuickGenre("all");
    setDetailFilters(emptyDetailFilters);
  };

  const handleCardTap = (webtoon: Webtoon) => {
    if (selectedWebtoon?.id === webtoon.id) {
      setDetailWebtoon(webtoon);
      return;
    }
    setSelectedWebtoon(webtoon);
  };

  const handleSelect = (webtoon: Webtoon) => {
    setSelectedWebtoon((prev) => (prev?.id === webtoon.id ? null : webtoon));
  };

  const goNext = () => {
    if (!selectedWebtoon) return;
    router.push(
      prepareTasteAnalysis(selectedWebtoon.id, selectedWebtoon.title, {
        origin: "HOME",
        source: "home",
        thumbnailUrl: selectedWebtoon.thumbnailUrl,
        platform: selectedWebtoon.platform,
      })
    );
  };

  if (error) {
    return (
      <ErrorState
        title="웹툰을 불러오지 못했어요."
        description="잠시 후 다시 시도해주세요."
        onRetry={onRetry ?? (() => router.refresh())}
      />
    );
  }

  if (webtoons.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="아직 등록된 웹툰이 없어요."
        description="데이터가 추가되면 이곳에서 선택할 수 있어요."
      />
    );
  }

  const showBottomPadding = !!selectedWebtoon && !searchFocused;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background md:mx-auto md:max-w-5xl">
      <DesktopContent className="max-w-none shrink-0 px-5 pt-safe pt-4 md:px-8 md:pt-6">
        <header className="pb-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            취향 분석
          </p>
          <h1 className="text-[26px] font-bold leading-[1.25] tracking-tight text-foreground md:text-[28px]">
            가장 재밌게 본
            <br className="md:hidden" />
            <span className="hidden md:inline"> </span>
            웹툰 하나를 골라주세요
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Toona가 취향을 분석해 다음으로 볼 작품을 찾아드릴게요.
          </p>
        </header>
      </DesktopContent>

      <div className="sticky top-0 z-20 shrink-0 space-y-3 border-b border-border bg-background/95 px-5 py-3 backdrop-blur-md md:px-8">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="웹툰 제목이나 작가를 검색해보세요"
            className="h-11 pl-10"
            aria-label="웹툰 검색"
          />
        </div>

        <div className="flex items-center gap-2">
          <GenreChips
            value={quickGenre}
            onChange={setQuickGenre}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="relative h-9 w-9 shrink-0 rounded-xl border-border bg-card touch-target"
            aria-label="상세 필터"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 ? (
              <Badge className="absolute -right-1.5 -top-1.5 h-5 min-w-5 justify-center bg-primary px-1 text-[10px]">
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto px-5 pt-4 scrollbar-hide md:px-8 ${
          showBottomPadding ? "pb-4" : "pb-8"
        }`}
      >
        {filtered.length === 0 ? (
          searchQuery.trim() ? (
            <EmptyState
              icon={SearchX}
              title="찾는 웹툰이 없어요"
              description="다른 제목이나 작가명으로 검색해보세요."
              actionLabel="초기화"
              onAction={resetFilters}
            />
          ) : (
            <EmptyState
              icon={SearchX}
              title="조건에 맞는 웹툰이 없어요."
              description="필터를 조금 줄여보세요."
              actionLabel="필터 초기화"
              onAction={resetFilters}
            />
          )
        ) : (
          <div className="mx-auto grid max-w-5xl grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 md:gap-3 lg:grid-cols-6 lg:gap-4">
            {filtered.map((webtoon) => (
              <WebtoonSelectionCard
                key={webtoon.id}
                webtoon={webtoon}
                selected={selectedWebtoon?.id === webtoon.id}
                onSelect={handleCardTap}
              />
            ))}
          </div>
        )}
      </div>

      {/* 항상 하단 고정 — 선택 시 활성화 */}
      <div className="shrink-0 border-t border-border bg-background px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 md:px-8 md:pb-6">
        <button
          type="button"
          disabled={!selectedWebtoon}
          onClick={goNext}
          className={`w-full rounded-2xl py-4 text-[15px] font-semibold transition-all md:py-[18px] md:text-[16px] ${
            selectedWebtoon
              ? "bg-primary text-primary-foreground"
              : "cursor-not-allowed bg-elevated text-muted-foreground"
          }`}
        >
          {selectedWebtoon ? "선택 완료" : "웹툰을 선택해주세요"}
        </button>
      </div>

      <WebtoonDetailDrawer
        webtoon={detailWebtoon}
        open={!!detailWebtoon}
        onOpenChange={(open) => {
          if (!open) setDetailWebtoon(null);
        }}
        onSelect={handleSelect}
        selected={detailWebtoon?.id === selectedWebtoon?.id}
      />

      <WebtoonFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={detailFilters}
        onChange={setDetailFilters}
      />
    </div>
  );
}
