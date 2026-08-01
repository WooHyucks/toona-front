import { isSupportedPlatform } from "./constants";
import type {
  Platform,
  RankedWebtoon,
  Webtoon,
  WebtoonRankingRow,
  WebtoonRow,
} from "./types";

/** Raw DB row may still contain unsupported platforms (e.g. legacy lezhin) */
type RawWebtoonRow = Omit<WebtoonRow, "platform"> & { platform: string };
type RawRankingRow = Omit<WebtoonRankingRow, "platform"> & { platform: string };

export function mapWebtoonRowToWebtoon(row: WebtoonRow): Webtoon {
  const daysOfWeek =
    row.days_of_week ?? (row.day_of_week ? [row.day_of_week] : []);
  const genres = row.genres ?? (row.genre ? [row.genre] : []);
  const sourceTags = row.source_tags ?? [];

  return {
    id: row.id,
    platform: row.platform,
    platformId: row.platform_id,
    title: row.title,
    author: row.author,
    thumbnailUrl: row.thumb_url,
    platformUrl: row.link,
    primaryDay: row.day_of_week,
    daysOfWeek,
    rank: row.rank,
    primaryGenre: row.genre,
    genres,
    sourceTags,
    description: row.description,
    status: row.status,
    scrapedAt: row.scraped_at,
  };
}

export function mapWebtoonRowsToWebtoons(rows: RawWebtoonRow[]): Webtoon[] {
  const byId = new Map<string, Webtoon>();

  for (const row of rows) {
    if (!isSupportedPlatform(row.platform)) continue;
    byId.set(
      row.id,
      mapWebtoonRowToWebtoon({ ...row, platform: row.platform as Platform })
    );
  }

  return Array.from(byId.values());
}

export function mapRankingJoinRowToRankedWebtoon(
  ranking: WebtoonRankingRow,
  webtoon: Webtoon
): RankedWebtoon {
  return {
    ...webtoon,
    platform: ranking.platform ?? webtoon.platform,
    ranking: {
      type: ranking.ranking_type,
      rank: ranking.rank,
      dayOfWeek: ranking.day_of_week,
      rankingDate: ranking.ranking_date,
    },
  };
}

export function filterSupportedRankingRows(
  rows: RawRankingRow[]
): WebtoonRankingRow[] {
  return rows
    .filter((row) => isSupportedPlatform(row.platform))
    .map((row) => ({ ...row, platform: row.platform as Platform }));
}
