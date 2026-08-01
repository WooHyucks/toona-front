"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { WebtoonRailCard } from "@/features/webtoons/components/WebtoonCards";
import { useWebtoonSheet } from "@/features/shell/WebtoonSheetContext";
import {
  DesktopContent,
  DesktopPageHeader,
} from "@/features/shell/DesktopContent";
import { SectionIcon, type SectionIconId } from "@/features/ui/SectionIcon";
import {
  ALL_DAYS,
  DAY_LABEL,
  getTodayDayOfWeek,
  type DayOfWeek,
  type Webtoon,
} from "@/features/webtoons/model";
import { cn } from "@/lib/utils";
import { fetchWebtoons } from "@/lib/api/webtoons";
import { fetchRankings } from "@/lib/api/rankings";
import { mapListItemToWebtoon } from "@/lib/api/mappers";
import { ToonaApiError } from "@/lib/api/client";

type CategoryId =
  | "all"
  | "fantasy"
  | "romance"
  | "drama"
  | "completed"
  | "naver"
  | "kakao";

const PAGE_SIZE = 36;

const CATEGORIES: Array<{
  id: CategoryId;
  icon: SectionIconId;
  label: string;
}> = [
  { id: "all", icon: "compass", label: "전체" },
  { id: "fantasy", icon: "fantasy", label: "판타지·액션" },
  { id: "romance", icon: "romance", label: "로맨스" },
  { id: "drama", icon: "drama", label: "드라마" },
  { id: "completed", icon: "completed", label: "완결" },
  { id: "naver", icon: "naver", label: "네이버" },
  { id: "kakao", icon: "kakao", label: "카카오" },
];

const PAGE_META: Record<
  string,
  { title: string; description: string; category: CategoryId }
> = {
  completed: {
    title: "완결작",
    description: "정주행하기 좋은 완결 웹툰을 모아봤어요",
    category: "completed",
  },
  platform: {
    title: "플랫폼",
    description: "네이버·카카오 플랫폼별로 작품을 살펴보세요",
    category: "naver",
  },
};

type PageResult = {
  items: Webtoon[];
  hasMore: boolean;
};

type CacheEntry = {
  items: Webtoon[];
  offset: number;
  hasMore: boolean;
};

function resolveCategory(param: string | null): CategoryId {
  if (param === "completed") return "completed";
  if (param === "platform") return "naver";
  if (param === "naver" || param === "kakao") return param;
  if (param && CATEGORIES.some((c) => c.id === param)) {
    return param as CategoryId;
  }
  return "all";
}

function dedupeWebtoons(items: Webtoon[]): Webtoon[] {
  const seen = new Set<string>();
  const out: Webtoon[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

async function fetchMerged(
  queries: Array<Parameters<typeof fetchWebtoons>[0]>,
  signal: AbortSignal
): Promise<PageResult> {
  const results = await Promise.all(
    queries.map((q) => fetchWebtoons({ ...q, signal }))
  );
  const items = dedupeWebtoons(
    results.flatMap((res) => res.items.map(mapListItemToWebtoon))
  );
  const hasMore = results.some((res) => res.pagination.hasMore);
  return { items, hasMore };
}

async function loadPage(
  category: CategoryId,
  offset: number,
  signal: AbortSignal
): Promise<PageResult> {
  const limit = PAGE_SIZE;

  if (category === "completed") {
    if (offset === 0) {
      const [list, ranking] = await Promise.all([
        fetchWebtoons({ status: "COMPLETED", limit, offset: 0, signal }),
        fetchRankings({ type: "completed", limit: 40, signal }).catch(
          () => null
        ),
      ]);
      const fromRank =
        ranking?.items.map((row) => mapListItemToWebtoon(row.webtoon)) ?? [];
      const fromList = list.items.map(mapListItemToWebtoon);
      return {
        items: dedupeWebtoons([...fromRank, ...fromList]),
        hasMore: list.pagination.hasMore,
      };
    }
    const list = await fetchWebtoons({
      status: "COMPLETED",
      limit,
      offset,
      signal,
    });
    return {
      items: list.items.map(mapListItemToWebtoon),
      hasMore: list.pagination.hasMore,
    };
  }

  if (category === "naver") {
    const res = await fetchWebtoons({
      platform: "NAVER",
      limit,
      offset,
      signal,
    });
    return {
      items: res.items.map(mapListItemToWebtoon),
      hasMore: res.pagination.hasMore,
    };
  }

  if (category === "kakao") {
    const res = await fetchWebtoons({
      platform: "KAKAO",
      limit,
      offset,
      signal,
    });
    return {
      items: res.items.map(mapListItemToWebtoon),
      hasMore: res.pagination.hasMore,
    };
  }

  if (category === "fantasy") {
    return fetchMerged(
      [
        { genre: "Fantasy", limit, offset },
        { genre: "Action", limit, offset },
      ],
      signal
    );
  }

  if (category === "romance") {
    const res = await fetchWebtoons({
      genre: "Romance",
      limit,
      offset,
      signal,
    });
    return {
      items: res.items.map(mapListItemToWebtoon),
      hasMore: res.pagination.hasMore,
    };
  }

  if (category === "drama") {
    return fetchMerged(
      [
        { genre: "Drama", limit, offset },
        { genre: "Comedy", limit, offset },
      ],
      signal
    );
  }

  // all — unfiltered catalog pages (rank → title)
  const res = await fetchWebtoons({ limit, offset, signal });
  return {
    items: res.items.map(mapListItemToWebtoon),
    hasMore: res.pagination.hasMore,
  };
}

type DayFilter = "all" | "today" | DayOfWeek;

export function DiscoverScreen() {
  const { openWebtoon } = useWebtoonSheet();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("c");
  const pageMeta = categoryParam ? PAGE_META[categoryParam] : null;

  const [activeCategory, setActiveCategory] = useState<CategoryId>(() =>
    resolveCategory(categoryParam)
  );
  const [activeDay, setActiveDay] = useState<DayFilter>("all");
  const [items, setItems] = useState<Webtoon[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [status, setStatus] = useState<"loading" | "success" | "empty" | "error">(
    "loading"
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const today = getTodayDayOfWeek();

  const cacheRef = useRef<Partial<Record<CategoryId, CacheEntry>>>({});
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const activeCategoryRef = useRef(activeCategory);

  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const applyEntry = useCallback((entry: CacheEntry) => {
    offsetRef.current = entry.offset;
    hasMoreRef.current = entry.hasMore;
    setItems(entry.items);
    setHasMore(entry.hasMore);
    setStatus(entry.items.length ? "success" : "empty");
  }, []);

  const loadInitial = useCallback(
    async (category: CategoryId) => {
      const cached = cacheRef.current[category];
      if (cached) {
        applyEntry(cached);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;
      setStatus("loading");
      setLoadingMore(false);
      loadingMoreRef.current = false;

      try {
        const page = await loadPage(category, 0, controller.signal);
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        const entry: CacheEntry = {
          items: page.items,
          offset: page.items.length > 0 ? PAGE_SIZE : 0,
          // For completed first page we may have prepended rankings;
          // next list page still starts at PAGE_SIZE on the COMPLETED query.
          hasMore: page.hasMore,
        };
        // completed first page uses list offset PAGE_SIZE for next fetch
        if (category === "completed") {
          entry.offset = PAGE_SIZE;
        } else if (
          category === "fantasy" ||
          category === "drama"
        ) {
          entry.offset = PAGE_SIZE;
        } else {
          entry.offset = PAGE_SIZE;
        }
        cacheRef.current[category] = entry;
        applyEntry(entry);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (requestId !== requestIdRef.current) return;
        setErrorMessage(
          err instanceof ToonaApiError
            ? err.message
            : "작품을 불러오지 못했어요."
        );
        setStatus("error");
      }
    },
    [applyEntry]
  );

  const loadMore = useCallback(async () => {
    const category = activeCategoryRef.current;
    if (!hasMoreRef.current || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const controller = new AbortController();
    // Don't abort initial loads mid-flight via shared abort for more —
    // use a dedicated controller that won't cancel category switches incorrectly.
    const requestId = requestIdRef.current;
    const nextOffset = offsetRef.current;

    try {
      const page = await loadPage(category, nextOffset, controller.signal);
      if (requestId !== requestIdRef.current) return;
      if (activeCategoryRef.current !== category) return;

      const prev = cacheRef.current[category]?.items ?? [];
      const merged = dedupeWebtoons([...prev, ...page.items]);
      const entry: CacheEntry = {
        items: merged,
        offset: nextOffset + PAGE_SIZE,
        hasMore: page.hasMore && page.items.length > 0,
      };
      cacheRef.current[category] = entry;
      offsetRef.current = entry.offset;
      hasMoreRef.current = entry.hasMore;
      setItems(entry.items);
      setHasMore(entry.hasMore);
      setStatus(entry.items.length ? "success" : "empty");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      if (requestId !== requestIdRef.current) return;
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const next = resolveCategory(categoryParam);
    setActiveCategory(next);
    setActiveDay("all");
    void loadInitial(next);
  }, [categoryParam, loadInitial]);

  // Infinite scroll sentinel
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, status, activeCategory]);

  // If day filter leaves few cards, keep fetching until we have a decent set or exhaust
  useEffect(() => {
    if (activeDay === "all") return;
    if (status !== "success" || !hasMore || loadingMore) return;
    const visible =
      activeDay === "today"
        ? items.filter((w) => w.daysOfWeek.includes(today)).length
        : items.filter((w) => w.daysOfWeek.includes(activeDay)).length;
    if (visible < 12) {
      void loadMore();
    }
  }, [
    activeDay,
    hasMore,
    items,
    loadMore,
    loadingMore,
    status,
    today,
  ]);

  function selectCategory(next: CategoryId) {
    setActiveCategory(next);
    setActiveDay("all");

    const cached = cacheRef.current[next];
    if (cached) {
      applyEntry(cached);
    } else {
      void loadInitial(next);
    }

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (categoryParam === "platform" || categoryParam === "completed") {
        return;
      }
      if (next === "all") {
        params.delete("c");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      } else if (next === "completed") {
        params.set("c", "completed");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } else if (next === "naver" || next === "kakao") {
        params.set("c", "platform");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } else {
        params.set("c", next);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    });
  }

  const visibleCategories = useMemo(() => {
    if (categoryParam === "platform") {
      return CATEGORIES.filter((c) => c.id === "naver" || c.id === "kakao");
    }
    if (categoryParam === "completed") {
      return [];
    }
    return CATEGORIES;
  }, [categoryParam]);

  const filtered = useMemo(() => {
    let list = items;
    if (activeDay === "today") {
      list = list.filter((w) => w.daysOfWeek.includes(today));
    } else if (activeDay !== "all") {
      list = list.filter((w) => w.daysOfWeek.includes(activeDay));
    }
    return list;
  }, [activeDay, today, items]);

  const dayFilters: Array<{ id: DayFilter; label: string; highlight?: boolean }> =
    [
      { id: "all", label: "전체" },
      { id: "today", label: "오늘", highlight: true },
      ...ALL_DAYS.map((day) => ({
        id: day as DayFilter,
        label: DAY_LABEL[day],
        highlight: day === today,
      })),
    ];

  return (
    <div className="pb-10 md:pb-16">
      <DesktopContent>
        <DesktopPageHeader
          title={pageMeta?.title ?? "발견"}
          description={
            pageMeta?.description ??
            "장르·플랫폼·요일별로 작품을 탐색해보세요"
          }
        />

        {visibleCategories.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2 md:gap-2.5">
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category.id)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-medium transition-all md:text-[13px] lg:px-4 lg:py-2.5",
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                <SectionIcon id={category.icon} className="h-3.5 w-3.5" />
                {category.label}
              </button>
            ))}
          </div>
        ) : null}

        {categoryParam !== "completed" ? (
          <div className="mb-6">
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground md:text-[12px]">
              <SectionIcon id="today" className="h-3.5 w-3.5 text-primary" />
              요일별
            </p>
            <div className="flex flex-wrap gap-2">
              {dayFilters.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setActiveDay(day.id)}
                  className={cn(
                    "min-h-10 min-w-[40px] rounded-xl px-3 py-2 text-[12px] font-medium transition-all md:text-[13px]",
                    activeDay === day.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    day.highlight &&
                      activeDay !== day.id &&
                      "border-primary/30 text-foreground"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mb-4 text-[12px] text-muted-foreground md:text-[13px]">
          {status === "loading"
            ? "불러오는 중…"
            : `${filtered.length}개의 작품`}
          {status !== "loading" && hasMore ? " · 스크롤하면 더 불러와요" : null}
          {status !== "loading" && activeDay === "today"
            ? ` · ${DAY_LABEL[today]}요일 연재`
            : status !== "loading" && activeDay !== "all"
              ? ` · ${DAY_LABEL[activeDay as DayOfWeek]}요일 연재`
              : null}
        </p>

        {status === "loading" ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 md:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] animate-pulse rounded-xl bg-card" />
                <div className="mt-2 h-3 w-[80%] animate-pulse rounded bg-card" />
              </div>
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <div className="rounded-2xl bg-card px-4 py-10 text-center">
            <p className="text-[14px] font-medium text-foreground">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                delete cacheRef.current[activeCategory];
                void loadInitial(activeCategory);
              }}
              className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
            >
              다시 시도
            </button>
          </div>
        ) : null}

        {status === "empty" ? (
          <div className="rounded-2xl bg-card px-4 py-10 text-center">
            <p className="text-[14px] font-medium text-foreground">
              이 조건에 맞는 작품이 없어요.
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              다른 장르나 플랫폼을 선택해보세요.
            </p>
          </div>
        ) : null}

        {status === "success" ? (
          <>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 md:gap-4 lg:gap-5">
              {filtered.map((webtoon) => (
                <WebtoonRailCard
                  key={webtoon.id}
                  webtoon={webtoon}
                  onOpen={openWebtoon}
                  layout="grid"
                />
              ))}
            </div>

            <div
              ref={sentinelRef}
              className="flex min-h-12 items-center justify-center py-6"
              aria-hidden={!loadingMore}
            >
              {loadingMore ? (
                <div
                  className="flex items-center gap-2 text-[12px] text-muted-foreground"
                  role="status"
                  aria-label="더 불러오는 중"
                >
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  더 불러오는 중
                </div>
              ) : hasMore ? (
                <span className="text-[11px] text-muted-foreground/60">
                  아래로 스크롤
                </span>
              ) : filtered.length > 0 ? (
                <span className="text-[11px] text-muted-foreground/60">
                  모두 불러왔어요
                </span>
              ) : null}
            </div>
          </>
        ) : null}
      </DesktopContent>
    </div>
  );
}
