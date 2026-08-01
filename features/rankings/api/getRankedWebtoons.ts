/**
 * @deprecated Legacy Supabase direct ranking queries.
 * Home/rankings now use FastAPI via `lib/api/rankings.ts` and `lib/api/home.ts`.
 * Do not import this module for new screens.
 */
import { supabase } from "@/lib/supabase/client";
import {
  filterSupportedRankingRows,
  getSeoulDayOfWeek,
  isSupportedPlatform,
  mapRankingJoinRowToRankedWebtoon,
  mapWebtoonRowToWebtoon,
  type DayOfWeek,
  type Platform,
  type RankedWebtoon,
  type RankingType,
  type WebtoonRankingRow,
  type WebtoonRow,
} from "@/features/webtoons/model";
import type { GetRankedParams } from "@/features/rankings/model/ranking-utils";

export type HomeRankingBundle = {
  rankingDate: string | null;
  today: RankedWebtoon[];
  completed: RankedWebtoon[];
  naver: RankedWebtoon[];
  kakao: RankedWebtoon[];
  weekdayPool: RankedWebtoon[];
};

function emptyHomeBundle(): HomeRankingBundle {
  return {
    rankingDate: null,
    today: [],
    completed: [],
    naver: [],
    kakao: [],
    weekdayPool: [],
  };
}

export async function getLatestRankingDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from("webtoon_rankings")
    .select("ranking_date")
    .order("ranking_date", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[getLatestRankingDate]", error.message);
    throw new Error("RANKING_DATE_FETCH_FAILED");
  }

  return data?.[0]?.ranking_date ?? null;
}

async function fetchRankingsOnly(params: {
  rankingDate: string;
  rankingType: RankingType;
  dayOfWeek?: DayOfWeek;
  platform?: Platform;
  limit?: number;
}): Promise<WebtoonRankingRow[]> {
  let query = supabase
    .from("webtoon_rankings")
    .select(
      "id, webtoon_id, platform, ranking_type, day_of_week, rank, ranking_date, scraped_at"
    )
    .eq("ranking_date", params.rankingDate)
    .eq("ranking_type", params.rankingType)
    .in("platform", ["naver", "kakao"])
    .order("rank", { ascending: true });

  if (params.dayOfWeek) {
    query = query.eq("day_of_week", params.dayOfWeek);
  }
  if (params.platform) {
    query = query.eq("platform", params.platform);
  }
  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchRankingsOnly]", error.message);
    }
    throw new Error("RANKINGS_FETCH_FAILED");
  }

  return filterSupportedRankingRows(data ?? []);
}

async function fetchWebtoonsByIds(
  ids: string[]
): Promise<Map<string, WebtoonRow>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const map = new Map<string, WebtoonRow>();
  if (unique.length === 0) return map;

  const chunkSize = 100;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("webtoons")
      .select("*")
      .in("id", chunk)
      .in("platform", ["naver", "kakao"]);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[fetchWebtoonsByIds]", error.message);
      }
      throw new Error("WEBTOONS_BATCH_FETCH_FAILED");
    }

    for (const row of data ?? []) {
      if (!isSupportedPlatform(row.platform)) continue;
      map.set(row.id, row as WebtoonRow);
    }
  }

  return map;
}

function mergeRankings(
  rankings: WebtoonRankingRow[],
  webtoons: Map<string, WebtoonRow>
): RankedWebtoon[] {
  const result: RankedWebtoon[] = [];
  for (const ranking of rankings) {
    const row = webtoons.get(ranking.webtoon_id);
    if (!row) continue;
    result.push(
      mapRankingJoinRowToRankedWebtoon(ranking, mapWebtoonRowToWebtoon(row))
    );
  }
  return result;
}

/**
 * Ranking-first query with batched webtoon merge (no N+1).
 */
export async function getRankedWebtoons(
  params: GetRankedParams
): Promise<RankedWebtoon[]> {
  const rankingDate = params.rankingDate ?? (await getLatestRankingDate());
  if (!rankingDate) return [];

  const rankings = await fetchRankingsOnly({
    rankingDate,
    rankingType: params.rankingType,
    dayOfWeek: params.dayOfWeek,
    platform: params.platform,
    limit: params.limit,
  });

  if (rankings.length === 0) return [];

  const webtoons = await fetchWebtoonsByIds(rankings.map((r) => r.webtoon_id));
  return mergeRankings(rankings, webtoons);
}

export async function getWeekdayRankings(
  day: DayOfWeek,
  platform?: Platform,
  rankingDate?: string
): Promise<RankedWebtoon[]> {
  return getRankedWebtoons({
    rankingType: "weekday",
    dayOfWeek: day,
    platform,
    rankingDate,
    limit: 48,
  });
}

export async function getCompletedRankings(
  platform?: Platform,
  rankingDate?: string
): Promise<RankedWebtoon[]> {
  return getRankedWebtoons({
    rankingType: "completed",
    platform,
    rankingDate,
    limit: 72,
  });
}

export async function getPlatformRankings(
  platform: Platform,
  day: DayOfWeek,
  rankingDate?: string
): Promise<RankedWebtoon[]> {
  return getRankedWebtoons({
    rankingType: "weekday",
    dayOfWeek: day,
    platform,
    rankingDate,
    limit: 36,
  });
}

/**
 * Home bundle: one latest date, two ranking fetches, one webtoon batch,
 * then client-side rail classification. No webtoons.rank fallback.
 */
export async function getHomeRankingBundles(): Promise<HomeRankingBundle> {
  const rankingDate = await getLatestRankingDate();
  if (!rankingDate) return emptyHomeBundle();

  const day = getSeoulDayOfWeek();

  const [weekdayRows, completedRows] = await Promise.all([
    fetchRankingsOnly({
      rankingDate,
      rankingType: "weekday",
      limit: 300,
    }),
    fetchRankingsOnly({
      rankingDate,
      rankingType: "completed",
      limit: 80,
    }),
  ]);

  const webtoons = await fetchWebtoonsByIds([
    ...weekdayRows.map((r) => r.webtoon_id),
    ...completedRows.map((r) => r.webtoon_id),
  ]);

  const weekdayAll = mergeRankings(weekdayRows, webtoons);
  const completed = mergeRankings(completedRows, webtoons);

  const weekdayPool = weekdayAll.filter(
    (item) => item.ranking.dayOfWeek === day
  );
  const byPlatform = (platform: Platform) =>
    weekdayPool.filter((item) => item.platform === platform);

  return {
    rankingDate,
    today: weekdayPool,
    completed,
    naver: byPlatform("naver"),
    kakao: byPlatform("kakao"),
    weekdayPool,
  };
}
