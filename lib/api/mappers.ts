import type {
  Platform as ApiPlatform,
  WebtoonDetail,
  WebtoonListItem,
  WebtoonStatus as ApiStatus,
} from "@/types/api";
import type {
  DayOfWeek,
  Platform,
  ToonaGenre,
  Webtoon,
  WebtoonStatus,
} from "@/features/webtoons/model";

export function toUiPlatform(platform: string): Platform {
  return platform.toUpperCase() === "KAKAO" ? "kakao" : "naver";
}

export function toUiStatus(
  status: ApiStatus | string | null | undefined
): WebtoonStatus | null {
  if (!status) return null;
  const upper = status.toUpperCase();
  if (upper === "COMPLETED") return "completed";
  if (upper === "HIATUS") return "hiatus";
  if (upper === "ONGOING") return "ongoing";
  return null;
}

export function mapListItemToWebtoon(item: WebtoonListItem): Webtoon {
  const genres = (item.genres ?? []) as ToonaGenre[];
  return {
    id: item.id,
    platform: toUiPlatform(item.platform),
    platformId: "",
    title: item.title,
    author: item.author,
    thumbnailUrl: item.thumbnailUrl,
    platformUrl: item.officialUrl,
    primaryDay: (item.daysOfWeek?.[0] as DayOfWeek) ?? null,
    daysOfWeek: (item.daysOfWeek ?? []) as DayOfWeek[],
    rank: null,
    primaryGenre: genres[0] ?? null,
    genres,
    sourceTags: [],
    description: null,
    status: toUiStatus(item.status),
    scrapedAt: "",
    latestEpisodeNumber: item.latestEpisodeNumber ?? null,
    totalEpisodeCount: item.totalEpisodeCount ?? null,
  };
}

export function mapDetailToWebtoon(detail: WebtoonDetail): Webtoon {
  const genres = (detail.genres ?? []) as ToonaGenre[];
  return {
    id: detail.id,
    platform: toUiPlatform(detail.platform),
    platformId: detail.platformId,
    title: detail.title,
    author: detail.author,
    thumbnailUrl: detail.thumbnailUrl,
    platformUrl: detail.officialUrl,
    primaryDay: (detail.daysOfWeek?.[0] as DayOfWeek) ?? null,
    daysOfWeek: (detail.daysOfWeek ?? []) as DayOfWeek[],
    rank: null,
    primaryGenre: genres[0] ?? null,
    genres,
    sourceTags: detail.sourceTags ?? [],
    description: detail.synopsis,
    status: toUiStatus(detail.status),
    scrapedAt: "",
    latestEpisodeNumber: detail.latestEpisodeNumber ?? null,
    totalEpisodeCount: detail.totalEpisodeCount ?? null,
  };
}

export const RECOMMENDATION_TYPE_LABEL: Record<string, string> = {
  BEST_MATCH: "가장 잘 맞아요",
  DISCOVERY: "취향을 넓혀보세요",
  BINGE: "정주행 추천",
};

export function isApiPlatform(value: string): value is ApiPlatform {
  return value === "NAVER" || value === "KAKAO";
}
