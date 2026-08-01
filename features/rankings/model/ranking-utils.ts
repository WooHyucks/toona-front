import type { Platform, RankedWebtoon, RankingType } from "@/features/webtoons/model";

/** Interleave platforms so one platform doesn't dominate the rail head */
export function interleaveByPlatform(items: RankedWebtoon[]): RankedWebtoon[] {
  const buckets = new Map<Platform, RankedWebtoon[]>();

  for (const item of items) {
    const list = buckets.get(item.platform) ?? [];
    list.push(item);
    buckets.set(item.platform, list);
  }

  for (const list of Array.from(buckets.values())) {
    list.sort(
      (a: RankedWebtoon, b: RankedWebtoon) => a.ranking.rank - b.ranking.rank
    );
  }

  const platforms = Array.from(buckets.keys());
  const result: RankedWebtoon[] = [];
  let index = 0;
  let remaining = items.length;

  while (remaining > 0) {
    let progressed = false;
    for (const platform of platforms) {
      const list = buckets.get(platform);
      const next = list?.[index];
      if (next) {
        result.push(next);
        remaining -= 1;
        progressed = true;
      }
    }
    if (!progressed) break;
    index += 1;
  }

  return result;
}

export function filterRankedByGenre(
  items: RankedWebtoon[],
  genre: RankedWebtoon["primaryGenre"]
): RankedWebtoon[] {
  if (!genre) return [];
  const seen = new Set<string>();
  return items.filter((item) => {
    if (item.primaryGenre !== genre && !item.genres.includes(genre)) {
      return false;
    }
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function pickHomeHero(items: RankedWebtoon[]): RankedWebtoon | null {
  if (items.length === 0) return null;

  const sorted = items.slice().sort((a, b) => a.ranking.rank - b.ranking.rank);

  const withMedia = sorted.find((w) => w.thumbnailUrl && w.description);
  if (withMedia) return withMedia;

  const withThumb = sorted.find((w) => w.thumbnailUrl);
  if (withThumb) return withThumb;

  return sorted[0] ?? null;
}

export type HomeRailId =
  | "today"
  | "completed"
  | "naver"
  | "kakao"
  | "fantasy"
  | "action"
  | "romance"
  | "historical"
  | "popular"
  | string;

export type HomeRail = {
  id: HomeRailId;
  title: string;
  items: RankedWebtoon[];
};

export function buildHomeRails(input: {
  today: RankedWebtoon[];
  completed: RankedWebtoon[];
  naver: RankedWebtoon[];
  kakao: RankedWebtoon[];
  weekdayPool: RankedWebtoon[];
}): HomeRail[] {
  const rails: HomeRail[] = [
    {
      id: "today",
      title: "오늘 인기 있는 웹툰",
      items: interleaveByPlatform(input.today),
    },
    {
      id: "completed",
      title: "완결작 정주행",
      items: interleaveByPlatform(input.completed),
    },
    { id: "naver", title: "네이버웹툰 인기작", items: input.naver },
    { id: "kakao", title: "카카오웹툰 인기작", items: input.kakao },
  ];

  const genreRails: Array<{
    id: HomeRailId;
    title: string;
    genre: RankedWebtoon["primaryGenre"];
  }> = [
    { id: "fantasy", title: "판타지 인기작", genre: "Fantasy" },
    { id: "action", title: "액션 인기작", genre: "Action" },
    { id: "romance", title: "로맨스 인기작", genre: "Romance" },
    { id: "historical", title: "무협·사극 인기작", genre: "Historical" },
  ];

  for (const rail of genreRails) {
    const items = filterRankedByGenre(input.weekdayPool, rail.genre).slice(
      0,
      24
    );
    if (items.length >= 4) {
      rails.push({ id: rail.id, title: rail.title, items });
    }
  }

  return rails.filter((rail) => rail.items.length > 0);
}

export type GetRankedParams = {
  rankingType: RankingType;
  dayOfWeek?: import("@/features/webtoons/model").DayOfWeek;
  platform?: Platform;
  rankingDate?: string;
  limit?: number;
};
