"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { searchWebtoons } from "@/lib/api/webtoons";
import {
  dedupeWebtoons,
  fetchPopularReadyPool,
  fetchReadyCatalogPage,
  filterPoolByGenre,
  mergePopularThenCatalog,
} from "@/lib/api/onboarding-browse";
import { ToonaApiError } from "@/lib/api/client";
import { getSessionId } from "@/lib/session";
import type { SearchWebtoonItem, WebtoonListItem } from "@/types/api";
import { toUiPlatform } from "@/lib/api/mappers";
import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import { WebtoonThumbnail } from "@/features/webtoons/components/WebtoonThumbnail";
import {
  GENRE_LABELS,
  type ToonaGenre,
} from "@/features/webtoons/model";
import { cn } from "@/lib/utils";
import { getEpisodeLabel } from "@/lib/episode";
import { prepareTasteAnalysis } from "@/lib/taste-flow";
import { trackPageView } from "@/lib/analytics";
import { ToonaLogo } from "@/components/brand/ToonaLogo";
import { WeekendPicksSection } from "@/features/weekend-picks/WeekendPicksSection";
import { WeekendPicksOpenButton } from "@/features/weekend-picks/WeekendPicksOpenButton";

type GenreFilterId = "all" | ToonaGenre;

const PAGE_SIZE = 48;
const SEARCH_LIMIT = 30;

const GENRE_FILTERS: Array<{ id: GenreFilterId; label: string }> = [
  { id: "all", label: "전체" },
  { id: "Fantasy", label: "판타지" },
  { id: "Action", label: "액션" },
  { id: "Romance", label: "로맨스" },
  { id: "Historical", label: "무협" },
  { id: "Drama", label: "드라마" },
  { id: "Thriller", label: "스릴러" },
  { id: "Comedy", label: "코미디" },
];

type BrowseEntry = {
  items: WebtoonListItem[];
  /** Rankings-first titles not yet revealed via infinite scroll */
  remaining: WebtoonListItem[];
  catalogOffset: number;
  catalogHasMore: boolean;
  hasMore: boolean;
};

type BrowseCache = Partial<Record<GenreFilterId, BrowseEntry>>;

type Selectable = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  platform: string;
  recommendationReady: boolean;
};

function searchToListItem(item: SearchWebtoonItem): WebtoonListItem {
  return {
    id: item.id,
    title: item.title,
    platform: item.platform,
    author: item.author,
    status: item.status,
    thumbnailUrl: item.thumbnailUrl,
    officialUrl: null,
    genres: item.genres ?? [],
    daysOfWeek: [],
    latestEpisodeNumber: item.latestEpisodeNumber,
    totalEpisodeCount: item.totalEpisodeCount,
    recommendationReady: item.recommendationReady,
  };
}

function BrowseCard({
  item,
  selected,
  priority,
  onSelect,
}: {
  item: WebtoonListItem;
  selected: boolean;
  priority?: boolean;
  onSelect: () => void;
}) {
  const platform = toUiPlatform(item.platform);
  const episode = getEpisodeLabel({
    status: item.status,
    latestEpisodeNumber: item.latestEpisodeNumber,
    totalEpisodeCount: item.totalEpisodeCount,
  });
  const genre =
    item.genres[0] && item.genres[0] in GENRE_LABELS
      ? GENRE_LABELS[item.genres[0] as ToonaGenre]
      : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group w-full rounded-xl text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <div className="relative">
        <WebtoonThumbnail
          src={item.thumbnailUrl}
          title={item.title}
          platform={platform}
          priority={priority}
          seed={item.id}
        />
        {selected ? (
          <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 line-clamp-2 text-[12px] font-semibold leading-snug text-foreground">
        {item.title}
      </p>
      <div className="mt-0.5 flex min-w-0 items-center gap-1">
        <PlatformBadge platform={platform} size="xs" label="desktop" />
        <span className="min-w-0 flex-1 truncate text-[10px] leading-tight text-muted-foreground">
          {episode ?? genre ?? ""}
        </span>
      </div>
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="w-full">
      <div className="aspect-[3/4] animate-pulse rounded-xl bg-card" />
      <div className="mt-2 h-3 w-[80%] animate-pulse rounded bg-card" />
      <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-card" />
    </div>
  );
}

function takePage(
  queue: WebtoonListItem[],
  size: number
): { page: WebtoonListItem[]; remaining: WebtoonListItem[] } {
  return {
    page: queue.slice(0, size),
    remaining: queue.slice(size),
  };
}

export function OnboardingSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<GenreFilterId>("all");
  const [browseItems, setBrowseItems] = useState<WebtoonListItem[]>([]);
  const [browseHasMore, setBrowseHasMore] = useState(true);
  const [browseStatus, setBrowseStatus] = useState<
    "loading" | "success" | "empty" | "error"
  >("loading");
  const [browseError, setBrowseError] = useState("");
  const [genreLoading, setGenreLoading] = useState(false);
  const [browseLoadingMore, setBrowseLoadingMore] = useState(false);

  const [searchCards, setSearchCards] = useState<WebtoonListItem[]>([]);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "success" | "empty" | "error"
  >("idle");
  const [searchError, setSearchError] = useState("");

  const [selected, setSelected] = useState<Selectable | null>(null);
  const [picksAvailable, setPicksAvailable] = useState(false);
  const [picksReopenKey, setPicksReopenKey] = useState(0);

  const cacheRef = useRef<BrowseCache>({});
  const popularPoolRef = useRef<WebtoonListItem[] | null>(null);
  const browseAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const genreRequestId = useRef(0);
  const browseHasMoreRef = useRef(true);
  const browseLoadingMoreRef = useRef(false);
  const genreRef = useRef<GenreFilterId>("all");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isSearching = query.trim().length > 0;

  useEffect(() => {
    getSessionId();
    trackPageView();
  }, []);

  useEffect(() => {
    genreRef.current = genre;
  }, [genre]);

  const applyBrowseEntry = useCallback((entry: BrowseEntry) => {
    browseHasMoreRef.current = entry.hasMore;
    setBrowseItems(entry.items);
    setBrowseHasMore(entry.hasMore);
    setBrowseStatus(entry.items.length ? "success" : "empty");
  }, []);

  const ensurePopularPool = useCallback(async (signal: AbortSignal) => {
    if (popularPoolRef.current) return popularPoolRef.current;
    const pool = await fetchPopularReadyPool(signal);
    popularPoolRef.current = pool;
    return pool;
  }, []);

  const loadBrowseInitial = useCallback(
    async (nextGenre: GenreFilterId, opts?: { force?: boolean }) => {
      if (!opts?.force && cacheRef.current[nextGenre]) {
        applyBrowseEntry(cacheRef.current[nextGenre]!);
        return;
      }

      browseAbortRef.current?.abort();
      const controller = new AbortController();
      browseAbortRef.current = controller;
      const requestId = ++genreRequestId.current;

      setGenreLoading(true);
      setBrowseLoadingMore(false);
      browseLoadingMoreRef.current = false;
      if (!cacheRef.current[nextGenre] || opts?.force) setBrowseStatus("loading");
      if (opts?.force) {
        popularPoolRef.current = null;
        cacheRef.current = {};
      }

      try {
        const [pool, catalog] = await Promise.all([
          ensurePopularPool(controller.signal),
          fetchReadyCatalogPage({
            genre: nextGenre === "all" ? undefined : nextGenre,
            limit: PAGE_SIZE,
            offset: 0,
            signal: controller.signal,
          }),
        ]);
        if (controller.signal.aborted || requestId !== genreRequestId.current) {
          return;
        }

        const popular = filterPoolByGenre(pool, nextGenre);
        const merged = mergePopularThenCatalog(popular, catalog.items);
        const { page, remaining } = takePage(merged, PAGE_SIZE);
        const entry: BrowseEntry = {
          items: page,
          remaining,
          catalogOffset: PAGE_SIZE,
          catalogHasMore: catalog.hasMore,
          hasMore: remaining.length > 0 || catalog.hasMore,
        };
        cacheRef.current = { ...cacheRef.current, [nextGenre]: entry };
        applyBrowseEntry(entry);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (requestId !== genreRequestId.current) return;
        setBrowseError(
          err instanceof ToonaApiError
            ? err.message
            : "작품을 불러오지 못했어요."
        );
        setBrowseStatus("error");
      } finally {
        if (requestId === genreRequestId.current) setGenreLoading(false);
      }
    },
    [applyBrowseEntry, ensurePopularPool]
  );

  const loadBrowseMore = useCallback(async () => {
    const currentGenre = genreRef.current;
    if (!browseHasMoreRef.current || browseLoadingMoreRef.current) return;
    if (isSearching) return;

    const cached = cacheRef.current[currentGenre];
    if (!cached) return;

    browseLoadingMoreRef.current = true;
    setBrowseLoadingMore(true);
    const requestId = genreRequestId.current;

    try {
      // Reveal more from the rankings-first pool first (no network).
      if (cached.remaining.length > 0) {
        const { page, remaining } = takePage(cached.remaining, PAGE_SIZE);
        const entry: BrowseEntry = {
          ...cached,
          items: dedupeWebtoons([...cached.items, ...page]),
          remaining,
          hasMore: remaining.length > 0 || cached.catalogHasMore,
        };
        cacheRef.current = { ...cacheRef.current, [currentGenre]: entry };
        if (requestId !== genreRequestId.current) return;
        if (genreRef.current !== currentGenre) return;
        applyBrowseEntry(entry);
        return;
      }

      if (!cached.catalogHasMore) {
        const entry: BrowseEntry = { ...cached, hasMore: false };
        cacheRef.current = { ...cacheRef.current, [currentGenre]: entry };
        applyBrowseEntry(entry);
        return;
      }

      let catalogOffset = cached.catalogOffset;
      let catalogHasMore: boolean = cached.catalogHasMore;
      let items = cached.items;
      let guard = 0;

      // Catalog pages often overlap the rankings pool — skip empty dup pages.
      while (catalogHasMore && guard < 5) {
        guard += 1;
        const catalog = await fetchReadyCatalogPage({
          genre: currentGenre === "all" ? undefined : currentGenre,
          limit: PAGE_SIZE,
          offset: catalogOffset,
        });
        if (requestId !== genreRequestId.current) return;
        if (genreRef.current !== currentGenre) return;

        const existingIds = new Set(items.map((item) => item.id));
        const fresh = catalog.items.filter((item) => !existingIds.has(item.id));
        catalogOffset += PAGE_SIZE;
        catalogHasMore = catalog.hasMore;
        if (fresh.length > 0) {
          items = dedupeWebtoons([...items, ...fresh]);
          break;
        }
      }

      const entry: BrowseEntry = {
        items,
        remaining: [],
        catalogOffset,
        catalogHasMore,
        hasMore: catalogHasMore,
      };
      cacheRef.current = { ...cacheRef.current, [currentGenre]: entry };
      applyBrowseEntry(entry);
    } catch {
      browseHasMoreRef.current = false;
      setBrowseHasMore(false);
    } finally {
      browseLoadingMoreRef.current = false;
      setBrowseLoadingMore(false);
    }
  }, [applyBrowseEntry, isSearching]);

  useEffect(() => {
    void loadBrowseInitial("all");
  }, [loadBrowseInitial]);

  // Infinite scroll — observe against the list scroller (must be height-constrained)
  useEffect(() => {
    if (isSearching || browseStatus !== "success") return;
    const root = scrollRef.current;
    const node = sentinelRef.current;
    if (!root || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadBrowseMore();
        }
      },
      { root, rootMargin: "400px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [browseStatus, isSearching, loadBrowseMore, genre, browseItems.length]);

  // If the first page doesn't fill the screen, keep fetching until it does
  useEffect(() => {
    if (isSearching || browseStatus !== "success") return;
    if (!browseHasMore || browseLoadingMore) return;
    const root = scrollRef.current;
    if (!root) return;
    if (root.scrollHeight <= root.clientHeight + 80) {
      void loadBrowseMore();
    }
  }, [
    browseItems.length,
    browseHasMore,
    browseLoadingMore,
    browseStatus,
    isSearching,
    loadBrowseMore,
  ]);

  const runSearch = useCallback(async (value: string) => {
    const q = value.trim();
    if (!q) {
      setSearchCards([]);
      setSearchStatus("idle");
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearchStatus("loading");

    try {
      // Show all matching titles — do not filter by recommendationReady
      const res = await searchWebtoons({
        q,
        limit: SEARCH_LIMIT,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      const cards = res.items.map(searchToListItem);
      setSearchCards(cards);
      setSearchStatus(cards.length === 0 ? "empty" : "success");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setSearchError(
        err instanceof ToonaApiError
          ? err.message
          : "검색에 실패했어요. 잠시 후 다시 시도해주세요."
      );
      setSearchStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => runSearch(query), 300);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  function onGenreChange(next: GenreFilterId) {
    setGenre(next);
    setSelected(null);
    void loadBrowseInitial(next);
  }

  function clearSearch() {
    setQuery("");
    setSearchCards([]);
    setSearchStatus("idle");
    setSelected(null);
  }

  function selectItem(item: WebtoonListItem) {
    setSelected({
      id: item.id,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      platform: item.platform,
      recommendationReady: item.recommendationReady,
    });
  }

  function confirmSelection() {
    if (!selected) return;
    router.push(
      prepareTasteAnalysis(selected.id, selected.title, {
        origin: "HOME",
        source: "home",
        thumbnailUrl: selected.thumbnailUrl,
        platform: selected.platform,
      })
    );
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-lg flex-col overflow-hidden bg-background md:max-w-3xl lg:max-w-4xl">
      <div className="shrink-0 px-4 pt-4 md:px-6">
        <div className="mb-4">
          <ToonaLogo size="sm" priority />
        </div>
        <div className="mb-4">
          <p className="text-[12px] font-medium text-primary">
            이번 주말 뭐 보지?
          </p>
          <h1 className="mt-1 text-[20px] font-bold leading-snug tracking-[-0.02em] text-foreground md:text-[22px]">
            이번 주말 정주행할 웹툰 TOP3
          </h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground md:text-[14px]">
            제일 재밌게 본 웹툰 하나만 골라보세요.
          </p>
          {picksAvailable ? (
            <WeekendPicksOpenButton
              available
              onOpen={() => setPicksReopenKey((key) => key + 1)}
            />
          ) : null}
        </div>

        <form
          role="search"
          className="relative mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(query);
          }}
        >
          <label htmlFor="onboarding-search" className="sr-only">
            웹툰 검색
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="onboarding-search"
            type="search"
            value={query}
            autoComplete="off"
            placeholder="작품명 또는 작가명"
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            className="h-12 w-full rounded-2xl border border-border bg-card pl-10 pr-10 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 md:text-[14px]"
          />
          {query ? (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </form>

        {!isSearching ? (
          <div
            className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:px-0"
            role="tablist"
            aria-label="장르 필터"
          >
            {GENRE_FILTERS.map((chip) => {
              const active = genre === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={genreLoading && active}
                  onClick={() => onGenreChange(chip.id)}
                  className={cn(
                    "min-h-10 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground",
                    genreLoading && active && "opacity-70"
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 scrollbar-hide md:px-6"
      >
        {!isSearching ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-foreground">
                요즘 많이 보는 작품
              </h2>
              {genreLoading ? (
                <span className="text-[11px] text-muted-foreground">
                  불러오는 중
                </span>
              ) : null}
            </div>

            {browseStatus === "loading" ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : null}

            {browseStatus === "error" ? (
              <div className="rounded-2xl bg-card px-4 py-8 text-center">
                <p className="text-[14px] font-medium text-foreground">
                  {browseError}
                </p>
                <button
                  type="button"
                  onClick={() => loadBrowseInitial(genre, { force: true })}
                  className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
                >
                  다시 시도
                </button>
              </div>
            ) : null}

            {browseStatus === "empty" ? (
              <div className="rounded-2xl bg-card px-4 py-8 text-center">
                <p className="text-[14px] font-medium text-foreground">
                  아직 추천 가능한 작품을 준비하고 있어요.
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  잠시 후 다시 시도하거나 검색으로 찾아보세요.
                </p>
                <button
                  type="button"
                  onClick={() => loadBrowseInitial(genre, { force: true })}
                  className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
                >
                  다시 시도
                </button>
              </div>
            ) : null}

            {browseStatus === "success" ? (
              <>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {browseItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.015, 0.12) }}
                    >
                      <BrowseCard
                        item={item}
                        priority={index < 6}
                        selected={selected?.id === item.id}
                        onSelect={() => selectItem(item)}
                      />
                    </motion.div>
                  ))}
                </div>
                <div
                  ref={sentinelRef}
                  className="flex min-h-10 items-center justify-center py-4"
                  aria-hidden={!browseLoadingMore}
                >
                  {browseLoadingMore ? (
                    <div
                      className="flex items-center gap-2 text-[12px] text-muted-foreground"
                      role="status"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      더 불러오는 중
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <>
            <h2 className="mb-3 text-[14px] font-semibold text-foreground">
              ‘{query.trim()}’ 검색 결과
              {searchStatus === "success"
                ? ` · ${searchCards.length}개`
                : null}
            </h2>

            {searchStatus === "loading" ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : null}

            {searchStatus === "error" ? (
              <div className="rounded-2xl bg-card px-4 py-8 text-center">
                <p className="text-[14px] font-medium text-foreground">
                  {searchError}
                </p>
                <button
                  type="button"
                  onClick={() => runSearch(query)}
                  className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
                >
                  다시 시도
                </button>
              </div>
            ) : null}

            {searchStatus === "empty" ? (
              <div className="rounded-2xl bg-card px-4 py-8 text-center">
                <p className="text-[14px] font-medium text-foreground">
                  검색 결과가 없어요.
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  작품명을 다시 확인하거나 장르에서 골라보세요.
                </p>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-4 min-h-11 rounded-xl border border-border px-4 text-[13px] font-semibold text-foreground"
                >
                  검색어 지우기
                </button>
              </div>
            ) : null}

            {searchStatus === "success" ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {searchCards.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.015, 0.12) }}
                  >
                    <BrowseCard
                      item={item}
                      priority={index < 6}
                      selected={selected?.id === item.id}
                      onSelect={() => selectItem(item)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md md:px-6"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto w-full max-w-lg md:max-w-3xl lg:max-w-4xl">
          {selected ? (
            <p className="mb-2 truncate text-center text-[12px] text-muted-foreground">
              선택됨 · {selected.title}
              {!selected.recommendationReady
                ? " · 취향 분석이 아직 준비 중일 수 있어요"
                : null}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!selected}
            onClick={confirmSelection}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
          >
            이 작품으로 추천받기
          </button>
        </div>
      </div>

      <WeekendPicksSection
        reopenKey={picksReopenKey}
        onAvailableChange={setPicksAvailable}
        onPersonalize={() => {
          window.setTimeout(() => {
            document.getElementById("onboarding-search")?.focus();
          }, 150);
        }}
      />
    </div>
  );
}
