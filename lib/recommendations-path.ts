import { getSiteUrl } from "@/lib/seo/metadata";

/** Canonical path for a recommendation result (no query). */
export function recommendationResultPath(webtoonId: string): string {
  return `/recommendations/${encodeURIComponent(webtoonId)}`;
}

/**
 * Absolute share URL. Includes source=share for recipient CTA/analytics.
 * Canonical metadata omits this query.
 */
export function recommendationShareUrl(webtoonId: string): string {
  return `${getSiteUrl()}${recommendationResultPath(webtoonId)}?source=share`;
}

export function recommendationHref(
  webtoonId: string,
  options?: { source?: string | null; title?: string | null }
): string {
  const path = recommendationResultPath(webtoonId);
  const qs = new URLSearchParams();
  if (options?.source) qs.set("source", options.source);
  if (options?.title) qs.set("title", options.title);
  const q = qs.toString();
  return q ? `${path}?${q}` : path;
}
