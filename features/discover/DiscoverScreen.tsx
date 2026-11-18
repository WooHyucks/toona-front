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
  getTodayDayOfWeek,
  type DayOfWeek,
  type Webtoon,
} from "@/features/webtoons/model";
import { cn } from "@/lib/utils";
import { fetchWebtoons } from "@/lib/api/webtoons";
import { fetchRankings } from "@/lib/api/rankings";
import { mapListItemToWebtoon } from "@/lib/api/mappers";
import { ToonaApiError } from "@/lib/api/client";
import { useT } from "@/lib/i18n/LocaleProvider";

type CategoryId =
  | "all"
  | "fantasy"
  | "romance"
  | "drama"
  | "completed"
  | "naver"
  | "kakao";

const PAGE_SIZE = 36;

const CATEGORY_DEFS: Array<{
  id: CategoryId;
  icon: SectionIconId;
  labelKey: string;
}> = [
  { id: "all", icon: "compass", labelKey: "discover.all" },
  { id: "fantasy", icon: "fantasy", labelKey: "discover.fantasyAction" },
  { id: "romance", icon: "romance", labelKey: "discover.romance" },
  { id: "drama", icon: "drama", labelKey: "discover.drama" },
  { id: "completed", icon: "completed", labelKey: "discover.completed" },
  { id: "naver", icon: "naver", labelKey: "discover.naver" },
  { id: "kakao", icon: "kakao", labelKey: "discover.kakao" },
];

const PAGE_META_KEYS: Record<
  string,
  { titleKey: string; descriptionKey: string; category: CategoryId }
> = {
  completed: {
    titleKey: "discover.completedTitle",
    descriptionKey: "discover.completedDesc",
    category: "completed",
  },
  platform: {
    titleKey: "discover.platformTitle",
    descriptionKey: "discover.platformDesc",
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
  if (param && CATEGORY_DEFS.some((c) => c.id === param)) {
    return param as CategoryId;
  }
  return "all";
}

const DAY_I18N_KEY: Record<DayOfWeek, string> = {
  mon: "discover.days.mon",
  tue: "discover.days.tue",
  wed: "discover.days.wed",
  thu: "discover.days.thu",
  fri: "discover.days.fri",
  sat: "discover.days.sat",
  sun: "discover.days.sun",
};

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
  const t = useT();
  const { openWebtoon } = useWebtoonSheet();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("c");
  const pageMetaKeys = categoryParam ? PAGE_META_KEYS[categoryParam] : null;

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
            : t("discover.loadFailed")
        );
        setStatus("error");
      }
    },
    [applyEntry, t]
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
      return CATEGORY_DEFS.filter((c) => c.id === "naver" || c.id === "kakao");
    }
    if (categoryParam === "completed") {
      return [];
    }
    return CATEGORY_DEFS;
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
      { id: "all", label: t("discover.all") },
      { id: "today", label: t("discover.today"), highlight: true },
      ...ALL_DAYS.map((day) => ({
        id: day as DayFilter,
        label: t(DAY_I18N_KEY[day]),
        highlight: day === today,
      })),
    ];

  return (
    <div className="pb-10 md:pb-16">
      <DesktopContent>
        <DesktopPageHeader
          title={
            pageMetaKeys
              ? t(pageMetaKeys.titleKey)
              : t("discover.discoverTitle")
          }
          description={
            pageMetaKeys
              ? t(pageMetaKeys.descriptionKey)
              : t("discover.defaultDesc")
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
                {t(category.labelKey)}
              </button>
            ))}
          </div>
        ) : null}

        {categoryParam !== "completed" ? (
          <div className="mb-6">
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground md:text-[12px]">
              <SectionIcon id="today" className="h-3.5 w-3.5 text-primary" />
              {t("discover.byDay")}
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
            ? t("discover.loading")
            : t("discover.countWorks", { count: filtered.length })}
          {status !== "loading" && hasMore ? t("discover.scrollMore") : null}
          {status !== "loading" && activeDay === "today"
            ? t("discover.daySerial", { day: t(DAY_I18N_KEY[today]) })
            : status !== "loading" && activeDay !== "all"
              ? t("discover.daySerial", {
                  day: t(DAY_I18N_KEY[activeDay as DayOfWeek]),
                })
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
              {t("common.retry")}
            </button>
          </div>
        ) : null}

        {status === "empty" ? (
          <div className="rounded-2xl bg-card px-4 py-10 text-center">
            <p className="text-[14px] font-medium text-foreground">
              {t("discover.empty")}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {t("discover.emptyHint")}
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
                  aria-label={t("discover.loadingMore")}
                >
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  {t("discover.loadingMore")}
                </div>
              ) : hasMore ? (
                <span className="text-[11px] text-muted-foreground/60">
                  {t("discover.scrollDown")}
                </span>
              ) : filtered.length > 0 ? (
                <span className="text-[11px] text-muted-foreground/60">
                  {t("discover.allLoaded")}
                </span>
              ) : null}
            </div>
          </>
        ) : null}
      </DesktopContent>
    </div>
  );
}
