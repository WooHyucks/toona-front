import { apiFetch } from "@/lib/api/client";
import type {
  RecommendationsResponse,
  TasteAnalysisResponse,
} from "@/types/api";

export type FetchRecommendationsOptions = {
  sessionId?: string;
  /** Bypass result cache so "다시 추천" can return a new set */
  refresh?: boolean;
  /** Explicit IDs to exclude (e.g. currently shown cards) */
  excludeWebtoonIds?: string[];
  signal?: AbortSignal;
};

export async function fetchRecommendations(
  webtoonId: string,
  sessionIdOrOptions?: string | FetchRecommendationsOptions,
  signal?: AbortSignal
): Promise<RecommendationsResponse> {
  const options: FetchRecommendationsOptions =
    typeof sessionIdOrOptions === "string" || sessionIdOrOptions == null
      ? { sessionId: sessionIdOrOptions, signal }
      : sessionIdOrOptions;

  const qs = new URLSearchParams({ webtoonId });
  if (options.sessionId) qs.set("sessionId", options.sessionId);
  if (options.refresh) qs.set("refresh", "true");
  for (const id of options.excludeWebtoonIds ?? []) {
    const cleaned = id.trim();
    if (cleaned) qs.append("excludeWebtoonIds", cleaned);
  }
  return apiFetch<RecommendationsResponse>(
    `/api/recommendations?${qs.toString()}`,
    { signal: options.signal }
  );
}

export async function fetchTasteAnalysis(
  webtoonId: string,
  signal?: AbortSignal
): Promise<TasteAnalysisResponse> {
  return apiFetch<TasteAnalysisResponse>(
    `/api/webtoons/${encodeURIComponent(webtoonId)}/taste-analysis`,
    { signal }
  );
}
