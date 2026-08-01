import { fetchRecommendations } from "@/lib/api/recommendations";
import { fetchRankings } from "@/lib/api/rankings";
import { fetchWebtoons } from "@/lib/api/webtoons";
import { mapListItemToWebtoon } from "@/lib/api/mappers";
import { getSessionId } from "@/lib/session";
import type { RecommendationItem, RecommendationsResponse } from "@/types/api";
import type { RankedWebtoon, DayOfWeek } from "@/features/webtoons/model";
import { getSeoulDayOfWeek } from "@/features/webtoons/model";

export type HomeRailView = {
  id: string;
  title: string;
  items: RankedWebtoon[];
};

export type HomeHeroView = {
  sourceTitle: string;
  sourceId: string;
  slides: RecommendationItem[];
  weekendCopy: boolean;
};

export type HomeBundle = {
  hero: HomeHeroView | null;
  rails: HomeRailView[];
};

function toRanked(
  list: Parameters<typeof mapListItemToWebtoon>[0],
  rank: number,
  day: DayOfWeek | null = null
): RankedWebtoon {
  return {
    ...mapListItemToWebtoon(list),
    ranking: {
      type: "weekday",
      rank,
      dayOfWeek: day,
      rankingDate: "",
    },
  };
}

function resolveHeroSlides(
  data: RecommendationsResponse
): RecommendationItem[] {
  const slides = Array.isArray(data.heroSlides) ? data.heroSlides : [];
  if (slides.length > 0) return slides.slice(0, 3);

  // Soft fallback only when API omits heroSlides (older backends)
  const fallback =
    data.recommendations?.[0] ??
    data.sections?.completed?.[0] ??
    data.sections?.ongoing?.[0];
  return fallback ? [fallback] : [];
}

function isWeekendKST(): boolean {
  const day = getSeoulDayOfWeek();
  return day === "fri" || day === "sat" || day === "sun";
}

async function safe<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

export async function getHomeBundle(
  favoriteWebtoonId: string | null
): Promise<HomeBundle> {
  const today = getSeoulDayOfWeek();
  const sessionId =
    typeof window !== "undefined" ? getSessionId() : undefined;

  const [
    recommendations,
    popular,
    fantasy,
    action,
    historical,
    romance,
    completed,
    completedRanking,
  ] = await Promise.all([
    favoriteWebtoonId
      ? safe(fetchRecommendations(favoriteWebtoonId, sessionId))
      : Promise.resolve(null),
    safe(fetchRankings({ type: "weekday", day: today, limit: 20 })),
    safe(fetchWebtoons({ genre: "Fantasy", limit: 20 })),
    safe(fetchWebtoons({ genre: "Action", limit: 20 })),
    safe(fetchWebtoons({ genre: "Historical", limit: 20 })),
    safe(fetchWebtoons({ genre: "Romance", limit: 20 })),
    safe(fetchWebtoons({ status: "COMPLETED", limit: 40 })),
    safe(fetchRankings({ type: "completed", limit: 30 })),
  ]);

  let hero: HomeHeroView | null = null;
  if (recommendations) {
    const slides = resolveHeroSlides(recommendations);
    if (slides.length > 0) {
      hero = {
        sourceTitle: recommendations.source.title,
        sourceId: recommendations.source.id,
        slides,
        weekendCopy: isWeekendKST(),
      };
    }
  }

  const rails: HomeRailView[] = [];

  if (popular?.items?.length) {
    rails.push({
      id: "popular",
      title: "오늘 인기 있는 작품",
      items: popular.items.map((row) =>
        toRanked(row.webtoon, row.rank, popular.dayOfWeek)
      ),
    });
  }

  const genreRails: Array<{
    id: string;
    title: string;
    data: typeof fantasy;
  }> = [
    { id: "fantasy", title: "판타지", data: fantasy },
    { id: "action", title: "액션", data: action },
    { id: "historical", title: "무협", data: historical },
    { id: "romance", title: "로맨스", data: romance },
  ];

  for (const rail of genreRails) {
    const items = rail.data?.items ?? [];
    if (items.length === 0) continue;
    rails.push({
      id: rail.id,
      title: rail.title,
      items: items.map((item, index) => toRanked(item, index + 1)),
    });
  }

  const completedItems = (() => {
    const fromRank =
      completedRanking?.items.map((row, index) =>
        toRanked(row.webtoon, row.rank || index + 1)
      ) ?? [];
    const fromList =
      completed?.items.map((item, index) => toRanked(item, index + 1)) ?? [];
    const seen = new Set<string>();
    const merged: RankedWebtoon[] = [];
    for (const item of [...fromRank, ...fromList]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
    return merged.slice(0, 40);
  })();

  if (completedItems.length > 0) {
    rails.push({
      id: "completed",
      title: "완결작",
      items: completedItems,
    });
  }

  return { hero, rails };
}
