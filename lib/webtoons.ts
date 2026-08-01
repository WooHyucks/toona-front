import { fetchRecommendations } from "@/lib/api/recommendations";
import { fetchWebtoonDetail } from "@/lib/api/webtoons";
import { mapDetailToWebtoon, mapListItemToWebtoon } from "@/lib/api/mappers";
import type { Webtoon } from "@/features/webtoons/model";
import type { RecommendedWebtoon } from "@/types/api";

export async function getWebtoonById(id: string): Promise<Webtoon | null> {
  try {
    const detail = await fetchWebtoonDetail(id);
    return mapDetailToWebtoon(detail);
  } catch {
    return null;
  }
}

export async function getWebtoonsByIds(ids: string[]): Promise<Webtoon[]> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const results = await Promise.all(unique.map((id) => getWebtoonById(id)));
  return results.filter((w): w is Webtoon => w != null);
}

function recommendedToWebtoon(item: RecommendedWebtoon): Webtoon {
  return mapListItemToWebtoon({
    id: item.id,
    title: item.title,
    platform: item.platform.toUpperCase() === "KAKAO" ? "KAKAO" : "NAVER",
    author: item.author,
    status:
      item.status?.toUpperCase() === "COMPLETED"
        ? "COMPLETED"
        : item.status?.toUpperCase() === "HIATUS"
          ? "HIATUS"
          : item.status
            ? "ONGOING"
            : null,
    thumbnailUrl: item.thumbnailUrl || null,
    officialUrl: item.officialUrl || null,
    genres: item.genres ?? [],
    daysOfWeek: [],
    latestEpisodeNumber: item.latestEpisodeNumber ?? null,
    totalEpisodeCount: item.totalEpisodeCount ?? null,
    recommendationReady: true,
  });
}

/** Legacy helper — now backed by FastAPI recommendations. */
export async function getSimilarWebtoons(
  sourceId: string,
  count = 2
): Promise<{ source: Webtoon | null; recommendations: Webtoon[] }> {
  try {
    const data = await fetchRecommendations(sourceId);
    const source =
      (await getWebtoonById(sourceId)) ??
      ({
        id: data.source.id,
        platform:
          String(data.source.platform).toUpperCase() === "KAKAO"
            ? "kakao"
            : "naver",
        platformId: "",
        title: data.source.title,
        author: null,
        thumbnailUrl: data.source.thumbnailUrl || null,
        platformUrl: null,
        primaryDay: null,
        daysOfWeek: [],
        rank: null,
        primaryGenre: null,
        genres: [],
        sourceTags: [],
        description: null,
        status: null,
        scrapedAt: "",
      } satisfies Webtoon);

    const pool = [
      ...data.sections.completed,
      ...data.sections.ongoing,
      ...data.recommendations,
    ];
    const seen = new Set<string>();
    const recommendations: Webtoon[] = [];
    for (const item of pool) {
      if (seen.has(item.webtoon.id)) continue;
      seen.add(item.webtoon.id);
      recommendations.push(recommendedToWebtoon(item.webtoon));
      if (recommendations.length >= count) break;
    }

    return { source, recommendations };
  } catch {
    return { source: null, recommendations: [] };
  }
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
