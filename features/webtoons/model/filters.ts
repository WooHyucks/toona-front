import type { DayOfWeek, Platform, ToonaGenre, Webtoon, WebtoonStatus } from "./types";

export type WebtoonFilters = {
  searchQuery: string;
  quickGenre: ToonaGenre | "all";
  platforms: Platform[];
  genres: ToonaGenre[];
  days: DayOfWeek[];
  statuses: WebtoonStatus[];
};

export function createInitialFilters(): WebtoonFilters {
  return {
    searchQuery: "",
    quickGenre: "all",
    platforms: [],
    genres: [],
    days: [],
    statuses: [],
  };
}

export function countActiveFilters(filters: WebtoonFilters): number {
  return (
    filters.platforms.length +
    filters.genres.length +
    filters.days.length +
    filters.statuses.length
  );
}

function matchesSearch(webtoon: Webtoon, query: string): boolean {
  if (!query) return true;

  const haystack = [
    webtoon.title,
    webtoon.author ?? "",
    ...webtoon.sourceTags,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function filterWebtoons(
  webtoons: Webtoon[],
  filters: WebtoonFilters
): Webtoon[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return webtoons.filter((webtoon) => {
    if (!matchesSearch(webtoon, query)) return false;

    if (
      filters.quickGenre !== "all" &&
      !webtoon.genres.includes(filters.quickGenre) &&
      webtoon.primaryGenre !== filters.quickGenre
    ) {
      return false;
    }

    if (
      filters.genres.length > 0 &&
      !webtoon.genres.some((genre) => filters.genres.includes(genre)) &&
      !(webtoon.primaryGenre && filters.genres.includes(webtoon.primaryGenre))
    ) {
      return false;
    }

    if (
      filters.platforms.length > 0 &&
      !filters.platforms.includes(webtoon.platform)
    ) {
      return false;
    }

    if (
      filters.days.length > 0 &&
      !webtoon.daysOfWeek.some((day) => filters.days.includes(day))
    ) {
      return false;
    }

    if (filters.statuses.length > 0) {
      if (!webtoon.status || !filters.statuses.includes(webtoon.status)) {
        return false;
      }
    }

    return true;
  });
}
