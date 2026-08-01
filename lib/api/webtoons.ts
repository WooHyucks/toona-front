import { apiFetch } from "@/lib/api/client";
import type {
  SearchWebtoonsResponse,
  WebtoonDetail,
  WebtoonsListResponse,
} from "@/types/api";

export type SearchWebtoonsParams = {
  q: string;
  recommendationReady?: boolean;
  platform?: "NAVER" | "KAKAO";
  limit?: number;
  signal?: AbortSignal;
};

export async function searchWebtoons(
  params: SearchWebtoonsParams
): Promise<SearchWebtoonsResponse> {
  const qs = new URLSearchParams({ q: params.q.trim() });
  if (params.recommendationReady === true) {
    qs.set("recommendationReady", "true");
  }
  if (params.platform) qs.set("platform", params.platform);
  if (params.limit != null) qs.set("limit", String(params.limit));

  return apiFetch<SearchWebtoonsResponse>(
    `/api/search/webtoons?${qs.toString()}`,
    { signal: params.signal }
  );
}

export type FetchWebtoonsParams = {
  platform?: "NAVER" | "KAKAO";
  status?: "ONGOING" | "COMPLETED" | "HIATUS";
  genre?: string;
  recommendationReady?: boolean;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
};

export async function fetchWebtoons(
  params: FetchWebtoonsParams = {}
): Promise<WebtoonsListResponse> {
  const qs = new URLSearchParams();
  if (params.platform) qs.set("platform", params.platform);
  if (params.status) qs.set("status", params.status);
  if (params.genre) qs.set("genre", params.genre);
  if (params.recommendationReady === true) {
    qs.set("recommendationReady", "true");
  }
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));

  const query = qs.toString();
  return apiFetch<WebtoonsListResponse>(
    `/api/webtoons${query ? `?${query}` : ""}`,
    { signal: params.signal }
  );
}

export async function fetchWebtoonDetail(
  webtoonId: string,
  signal?: AbortSignal
): Promise<WebtoonDetail> {
  return apiFetch<WebtoonDetail>(
    `/api/webtoons/${encodeURIComponent(webtoonId)}`,
    { signal }
  );
}
