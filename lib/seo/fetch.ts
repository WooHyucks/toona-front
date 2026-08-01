import { getApiBase } from "@/lib/api/client";
import type { WebtoonDetail, WorldCupShareResult } from "@/types/api";

const WEBTOON_REVALIDATE = 3600; // 1h
const WORLD_CUP_RESULT_REVALIDATE = 86400; // 24h — immutable after complete

/**
 * Server-only metadata fetch. Uses Next fetch cache (not apiFetch no-store).
 */
export async function fetchWebtoonDetailForMeta(
  webtoonId: string
): Promise<WebtoonDetail | null> {
  try {
    const res = await fetch(
      `${getApiBase()}/api/webtoons/${encodeURIComponent(webtoonId)}`,
      {
        next: { revalidate: WEBTOON_REVALIDATE },
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as WebtoonDetail;
  } catch {
    return null;
  }
}

export async function fetchWorldCupResultForMeta(
  resultId: string
): Promise<WorldCupShareResult | null> {
  try {
    const res = await fetch(
      `${getApiBase()}/api/world-cup/results/${encodeURIComponent(resultId)}`,
      {
        next: { revalidate: WORLD_CUP_RESULT_REVALIDATE },
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as WorldCupShareResult;
  } catch {
    return null;
  }
}
