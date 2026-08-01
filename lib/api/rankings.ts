import { apiFetch } from "@/lib/api/client";
import type { DayOfWeek, RankingResponse, RankingType } from "@/types/api";

export async function fetchRankings(params: {
  type: RankingType;
  day?: DayOfWeek;
  platform?: "NAVER" | "KAKAO";
  date?: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<RankingResponse> {
  const qs = new URLSearchParams({ type: params.type });
  if (params.day) qs.set("day", params.day);
  if (params.platform) qs.set("platform", params.platform);
  if (params.date) qs.set("date", params.date);
  if (params.limit != null) qs.set("limit", String(params.limit));

  return apiFetch<RankingResponse>(`/api/rankings?${qs.toString()}`, {
    signal: params.signal,
  });
}
