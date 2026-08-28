/** TOONA FastAPI contract types — FRONTEND_API.md */

export type Platform = "NAVER" | "KAKAO";
export type WebtoonStatus = "ONGOING" | "COMPLETED" | "HIATUS";
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type RankingType = "weekday" | "completed";
export type RecommendationType = "BEST_MATCH" | "DISCOVERY" | "BINGE";
export type ActionType =
  | "SELECTED"
  | "RECOMMENDED"
  | "CLICKED"
  | "SAVED"
  | "DISMISSED"
  | "ALREADY_READ";

export type TasteAxisCode =
  | "growth"
  | "catharsis"
  | "immersion"
  | "relationships"
  | "worldbuilding";

export interface ApiError {
  error: string;
  message: string;
  requestId: string;
}

export interface SearchWebtoonItem {
  id: string;
  title: string;
  platform: Platform;
  author: string | null;
  status: WebtoonStatus | null;
  thumbnailUrl: string | null;
  genres: string[];
  latestEpisodeNumber: number | null;
  totalEpisodeCount: number | null;
  recommendationReady: boolean;
}

export interface WebtoonListItem {
  id: string;
  title: string;
  platform: Platform;
  author: string | null;
  status: WebtoonStatus | null;
  thumbnailUrl: string | null;
  officialUrl: string | null;
  genres: string[];
  daysOfWeek: DayOfWeek[] | string[];
  latestEpisodeNumber: number | null;
  totalEpisodeCount: number | null;
  recommendationReady: boolean;
}

export interface Pagination {
  limit: number;
  offset: number;
  count: number;
  hasMore: boolean;
}

export interface TasteTag {
  key?: string;
  code?: string;
  label: string;
  score?: number;
}

export interface TasteAxis {
  code: TasteAxisCode | string;
  label: string;
  score: number;
}

export interface TasteAnalysis {
  summary: string;
  tags: TasteTag[];
  /** Always 5 axes when present — omit or incomplete → tag fallback UI */
  axes?: TasteAxis[];
  source: string;
  version: number;
  reviewed: boolean;
}

export interface MatchedTag {
  code: string;
  label: string;
}

export type SerializationStatus = WebtoonStatus | "연재중" | "완결" | "휴재" | string;
export type RecommendationRole = "BEST" | "BEST_MATCH" | "ALTERNATIVE" | string;

export interface RecommendedWebtoon {
  id: string;
  title: string;
  platform: Platform | string;
  author: string | null;
  status: WebtoonStatus | null;
  officialUrl: string | null;
  thumbnailUrl: string | null;
  dominantColor: string | null;
  genres: string[];
  latestEpisodeNumber: number | null;
  totalEpisodeCount: number | null;
  episodeCount?: number | null;
  serializationStatus?: SerializationStatus | null;
}

export interface RecommendationItem {
  recommendationType: RecommendationType;
  score: number;
  matchedTags: MatchedTag[];
  recommendationReason: string;
  webtoon: RecommendedWebtoon;
  recommendationRole?: RecommendationRole | null;
  episodeCount?: number | null;
  serializationStatus?: SerializationStatus | null;
}

export interface RecommendationSections {
  completed: RecommendationItem[];
  ongoing: RecommendationItem[];
}

export interface RecommendationsResponse {
  source: {
    id: string;
    title: string;
    platform: Platform | string;
    thumbnailUrl: string | null;
  };
  recommendations: RecommendationItem[];
  sections: RecommendationSections;
  /** 0–3 slides; may be omitted by older backends */
  heroSlides?: RecommendationItem[];
  /** Newer backends — prefer over scanning `recommendations` */
  bestRecommendation?: RecommendationItem | null;
  alternativeRecommendations?: RecommendationItem[];
}

export interface TasteAnalysisResponse {
  selectedWebtoon: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    platform: Platform | string;
  };
  analysis: TasteAnalysis;
  /** @deprecated Do not use for recommendation cards */
  recommendations: unknown[];
}

export interface WebtoonDetail {
  id: string;
  title: string;
  platform: Platform;
  platformId: string;
  author: string | null;
  synopsis: string | null;
  status: WebtoonStatus | null;
  thumbnailUrl: string | null;
  officialUrl: string | null;
  genres: string[];
  sourceTags: string[];
  daysOfWeek: DayOfWeek[] | string[];
  popularityScore: number | null;
  freeScore: number | null;
  dominantColor: string | null;
  latestEpisodeNumber: number | null;
  totalEpisodeCount: number | null;
  recommendationReady: boolean;
}

export interface RankingItem {
  rank: number;
  webtoon: WebtoonListItem;
}

export interface RankingResponse {
  rankingType: RankingType;
  dayOfWeek: DayOfWeek | null;
  rankingDate: string;
  items: RankingItem[];
}

export interface WebtoonsListResponse {
  items: WebtoonListItem[];
  pagination: Pagination;
}

export interface SearchWebtoonsResponse {
  query: string;
  items: SearchWebtoonItem[];
}

export interface WebtoonActionRequest {
  sessionId?: string | null;
  userId?: string | null;
  sourceWebtoonId?: string | null;
  targetWebtoonId: string;
  actionType: ActionType;
  recommendationType?: RecommendationType | null;
}

/** @deprecated Use TasteTag */
export type TasteAnalysisTag = TasteTag;

/* ─── World Cup (16-bracket acquisition funnel) ─────────────── */

export type WorldCupMode = "ACQUISITION" | "REPLAY";

export type WorldCupStatus = "IN_PROGRESS" | "COMPLETED" | "EXPIRED";

export type WorldCupRound =
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "FINAL";

export type WorldCupChoiceAction =
  | "SELECTED_LEFT"
  | "SELECTED_RIGHT"
  | "UNKNOWN_BOTH";

export interface WorldCupTournament {
  size: 16 | number;
  currentRound?: WorldCupRound | null;
  currentMatchIndex?: number | null;
  completedMatches: number;
  totalMatches: 15 | number;
}

export interface WorldCupWebtoon {
  id: string;
  title: string;
  platform: Platform | string;
  author?: string | null;
  status: WebtoonStatus | null;
  thumbnailUrl: string | null;
  officialUrl?: string | null;
  genres: string[];
  latestEpisodeNumber: number | null;
  totalEpisodeCount: number | null;
  dominantColor?: string | null;
}

export interface WorldCupMatch {
  matchId: string;
  round: WorldCupRound;
  matchIndex: number;
  left: WorldCupWebtoon;
  right: WorldCupWebtoon;
}

export interface WorldCupInProgressResponse {
  worldCupId: string;
  status: "IN_PROGRESS";
  mode: WorldCupMode;
  title: string;
  tournament: WorldCupTournament;
  match: WorldCupMatch;
  expiresAt: string;
  winner?: never;
  resultId?: never;
}

export interface WorldCupCompletedResponse {
  worldCupId: string;
  status: "COMPLETED";
  mode: WorldCupMode;
  title: string;
  tournament: WorldCupTournament;
  winner: WorldCupWebtoon;
  resultId: string;
  expiresAt: string;
  match?: WorldCupMatch | null;
}

export interface WorldCupExpiredResponse {
  worldCupId: string;
  status: "EXPIRED";
  mode?: WorldCupMode;
  title?: string;
  tournament?: WorldCupTournament;
  expiresAt?: string;
  match?: null;
  winner?: never;
}

export type WorldCupSessionResponse =
  | WorldCupInProgressResponse
  | WorldCupCompletedResponse
  | WorldCupExpiredResponse;

export type WorldCupChoiceResponse =
  | WorldCupInProgressResponse
  | WorldCupCompletedResponse;

export interface CreateWorldCupSessionRequest {
  sessionId: string;
  mode?: WorldCupMode | null;
}

export interface SubmitWorldCupChoiceRequest {
  matchId: string;
  leftWebtoonId: string;
  rightWebtoonId: string;
  action: WorldCupChoiceAction;
}

/** Shared result — winner only (no analysis/recommendations). */
export interface WorldCupShareResult {
  resultId: string;
  worldCupId?: string;
  winner: WorldCupWebtoon;
  title?: string;
  createdAt?: string;
}

/* ─── Lifetime webtoons (내 인생 웹툰) ───────────────────────── */

export type LifetimeWebtoonSource = "RECOMMENDATION" | "HOME";

export interface LifetimeWebtoonItem {
  id: string;
  title: string;
  platform: Platform;
  author: string | null;
  status: WebtoonStatus | null;
  thumbnailUrl: string | null;
  officialUrl: string | null;
  genres: string[];
  latestEpisodeNumber: number | null;
  totalEpisodeCount: number | null;
  addedAt: string;
}

export interface LifetimeWebtoonsResponse {
  items: LifetimeWebtoonItem[];
  count: number;
}

export interface AddLifetimeWebtoonRequest {
  sessionId: string;
  userId?: string | null;
  webtoonId: string;
  source: LifetimeWebtoonSource;
}

export interface AddLifetimeWebtoonResponse {
  ok: true;
  alreadyExists: boolean;
}

export interface RemoveLifetimeWebtoonResponse {
  ok: true;
}

/* ─── Weekend picks (이번 주말 투나 PICK) ───────────────────── */

export interface WeekendPickWebtoon {
  id: string;
  title: string;
  platform: Platform | string;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  officialUrl?: string | null;
  genres?: string[];
  status?: WebtoonStatus | null;
  synopsis?: string | null;
}

export interface WeekendPickReview {
  id: string;
  webtoonId: string;
  videoId?: string | null;
  videoUrl?: string | null;
  title?: string | null;
  channelTitle?: string | null;
  thumbnailUrl?: string | null;
  publishedAt?: string | null;
  durationSeconds?: number | null;
  viewCount?: number | null;
  score?: number | null;
  searchQuery?: string | null;
  status?: string | null;
  isPrimary?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface WeekendPickItem {
  position: number;
  label: string;
  reason: string;
  webtoon: WeekendPickWebtoon;
  primaryReview?: WeekendPickReview | null;
}

export interface WeekendPicksResponse {
  weekKey: string;
  requestedWeekKey?: string;
  isFallback?: boolean;
  items?: WeekendPickItem[];
  picks?: WeekendPickItem[];
}
