export type DayOfWeek =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export type WebtoonStatus = "ongoing" | "completed" | "hiatus";

export type ToonaGenre =
  | "Action"
  | "Romance"
  | "Drama"
  | "Fantasy"
  | "Comedy"
  | "Thriller"
  | "Sports"
  | "Historical";

/** Backend currently supports naver + kakao only */
export type Platform = "naver" | "kakao";

export type RankingType = "weekday" | "completed";

export interface WebtoonRow {
  id: string;
  platform: Platform;
  platform_id: string;
  day_of_week: DayOfWeek | null;
  days_of_week: DayOfWeek[] | null;
  title: string;
  author: string | null;
  thumb_url: string | null;
  link: string | null;
  rank: number | null;
  genre: ToonaGenre | null;
  genres: ToonaGenre[] | null;
  source_tags: string[] | null;
  description: string | null;
  status: WebtoonStatus | null;
  scraped_at: string;
}

export interface WebtoonRankingRow {
  id: string;
  webtoon_id: string;
  platform: Platform;
  ranking_type: RankingType;
  day_of_week: DayOfWeek | null;
  rank: number;
  ranking_date: string;
  scraped_at: string;
}

export interface Webtoon {
  id: string;
  platform: Platform;
  platformId: string;
  title: string;
  author: string | null;
  thumbnailUrl: string | null;
  platformUrl: string | null;
  primaryDay: DayOfWeek | null;
  daysOfWeek: DayOfWeek[];
  /** Legacy field from webtoons.rank — do not use for home ranking rails */
  rank: number | null;
  primaryGenre: ToonaGenre | null;
  genres: ToonaGenre[];
  sourceTags: string[];
  description: string | null;
  status: WebtoonStatus | null;
  scrapedAt: string;
  latestEpisodeNumber?: number | null;
  totalEpisodeCount?: number | null;
}

export interface RankedWebtoon extends Webtoon {
  ranking: {
    type: RankingType;
    rank: number;
    dayOfWeek: DayOfWeek | null;
    rankingDate: string;
  };
}
