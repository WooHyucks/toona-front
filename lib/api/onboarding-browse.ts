import { fetchRankings } from "@/lib/api/rankings";
import { fetchWebtoons } from "@/lib/api/webtoons";
import {
  ALL_DAYS,
  DAY_FROM_JS_INDEX,
  type ToonaGenre,
} from "@/features/webtoons/model";
import type { DayOfWeek, WebtoonListItem } from "@/types/api";

/**
 * Build a popularity-first pool of recommendation-ready titles.
 *
 * Backend quirk: many ranked works have recommendationReady=true on detail/rankings
 * but are missing from GET /api/webtoons?recommendationReady=true. Rankings are the
 * reliable source for "요즘 많이 보는" onboarding browse.
 */
export async function fetchPopularReadyPool(
  signal?: AbortSignal
): Promise<WebtoonListItem[]> {
  const today = DAY_FROM_JS_INDEX[new Date().getDay()] as DayOfWeek;
  const days: DayOfWeek[] = [
    today,
    ...ALL_DAYS.filter((day) => day !== today),
  ];

  const empty = { items: [] as Array<{ webtoon: WebtoonListItem }> };
  const results = await Promise.all([
    ...days.map((day) =>
      fetchRankings({ type: "weekday", day, limit: 50, signal }).catch(
        () => empty
      )
    ),
    fetchRankings({ type: "completed", limit: 50, signal }).catch(() => empty),
  ]);

  const out: WebtoonListItem[] = [];
  const seen = new Set<string>();

  for (const res of results) {
    for (const row of res.items) {
      const webtoon = row.webtoon;
      if (!webtoon.recommendationReady || seen.has(webtoon.id)) continue;
      seen.add(webtoon.id);
      out.push(webtoon);
    }
  }

  return out;
}

export function filterPoolByGenre(
  pool: WebtoonListItem[],
  genre: ToonaGenre | "all"
): WebtoonListItem[] {
  if (genre === "all") return pool;
  return pool.filter((item) => item.genres.includes(genre));
}

export async function fetchReadyCatalogPage(params: {
  genre?: ToonaGenre;
  limit: number;
  offset: number;
  signal?: AbortSignal;
}): Promise<{ items: WebtoonListItem[]; hasMore: boolean }> {
  const res = await fetchWebtoons({
    genre: params.genre,
    recommendationReady: true,
    limit: params.limit,
    offset: params.offset,
    signal: params.signal,
  });
  return {
    items: res.items.filter((item) => item.recommendationReady),
    hasMore: res.pagination.hasMore && res.items.length > 0,
  };
}

export function dedupeWebtoons(items: WebtoonListItem[]): WebtoonListItem[] {
  const seen = new Set<string>();
  const out: WebtoonListItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** Merge popular-first pool with a catalog page, popular order preserved. */
export function mergePopularThenCatalog(
  popular: WebtoonListItem[],
  catalog: WebtoonListItem[]
): WebtoonListItem[] {
  return dedupeWebtoons([...popular, ...catalog]);
}
