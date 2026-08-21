import { apiFetch } from "@/lib/api/client";
import type { WeekendPickItem, WeekendPicksResponse } from "@/types/api";

export function getWeekendPickItems(
  data: WeekendPicksResponse | null | undefined
): WeekendPickItem[] {
  if (!data) return [];
  const rows = data.items ?? data.picks ?? [];
  return Array.isArray(rows) ? rows.filter((row) => row?.webtoon?.id) : [];
}

export async function fetchWeekendPicks(
  signal?: AbortSignal
): Promise<WeekendPicksResponse> {
  return apiFetch<WeekendPicksResponse>("/content/weekend-picks", { signal });
}
