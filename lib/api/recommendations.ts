import { apiFetch } from "@/lib/api/client";
import type {
  RecommendationsResponse,
  TasteAnalysisResponse,
} from "@/types/api";

export async function fetchRecommendations(
  webtoonId: string,
  sessionId?: string,
  signal?: AbortSignal
): Promise<RecommendationsResponse> {
  const qs = new URLSearchParams({ webtoonId });
  if (sessionId) qs.set("sessionId", sessionId);
  return apiFetch<RecommendationsResponse>(
    `/api/recommendations?${qs.toString()}`,
    { signal }
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
