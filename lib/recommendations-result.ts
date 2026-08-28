import type { RecommendationItem, RecommendationsResponse } from "@/types/api";

function isBestRole(item: RecommendationItem | null | undefined): boolean {
  if (!item) return false;
  const role = String(item.recommendationRole ?? "").toUpperCase();
  if (role === "BEST" || role === "BEST_MATCH") return true;
  return String(item.recommendationType ?? "").toUpperCase() === "BEST_MATCH";
}

function fromSections(data: RecommendationsResponse): RecommendationItem[] {
  return [
    ...(data.sections?.completed ?? []),
    ...(data.sections?.ongoing ?? []),
  ];
}

/** Prefer dedicated BEST field, then role/type, then first recommendation. */
export function pickBestRecommendation(
  data: RecommendationsResponse | null | undefined
): RecommendationItem | null {
  if (!data) return null;
  if (data.bestRecommendation?.webtoon?.id) return data.bestRecommendation;

  const list = data.recommendations ?? [];
  const byRole = list.find(isBestRole);
  if (byRole) return byRole;
  if (list[0]?.webtoon?.id) return list[0];

  const sectionBest = fromSections(data).find(isBestRole);
  if (sectionBest) return sectionBest;
  return fromSections(data)[0] ?? null;
}

/** Up to 2 alternatives. Dedicated array first, then remaining recommendations. */
export function pickAlternativeRecommendations(
  data: RecommendationsResponse | null | undefined,
  best: RecommendationItem | null
): RecommendationItem[] {
  if (!data) return [];
  const bestId = best?.webtoon?.id;
  const seen = new Set<string>(bestId ? [bestId] : []);

  const take = (rows: RecommendationItem[] | null | undefined) => {
    const out: RecommendationItem[] = [];
    for (const row of rows ?? []) {
      const id = row?.webtoon?.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(row);
      if (out.length >= 2) break;
    }
    return out;
  };

  const fromDedicated = take(data.alternativeRecommendations);
  if (fromDedicated.length > 0) return fromDedicated;

  const fromList = take(data.recommendations);
  if (fromList.length > 0) return fromList;

  return take(fromSections(data));
}

export function hasRecommendationResults(
  data: RecommendationsResponse | null | undefined
): boolean {
  return Boolean(pickBestRecommendation(data));
}
