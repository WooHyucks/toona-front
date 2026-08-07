import { getSessionId, setFavoriteWebtoon } from "@/lib/session";
import { postWebtoonAction } from "@/lib/api/actions";
import {
  normalizePlatform,
  setRecentTasteSource,
  type TasteSourceOrigin,
} from "@/lib/recentTasteSource";
import { trackWebtoonSelected } from "@/lib/analytics";

export type TasteAnalysisOptions = {
  /** Query attribution only — does not change analysis/recommendation logic */
  source?: string;
  /** Recent-taste localStorage origin */
  origin?: TasteSourceOrigin;
  thumbnailUrl?: string | null;
  platform?: string | null;
};

function inferOrigin(source?: string): TasteSourceOrigin {
  const s = source?.toLowerCase();
  if (s === "world-cup" || s === "world_cup") return "WORLD_CUP";
  if (s === "shared" || s === "share") return "SHARED";
  if (s === "seo" || s === "webtoon") return "SEO";
  if (s === "returning" || s === "returning_user") return "HOME";
  return "HOME";
}

/** Build analyzing route for a chosen source webtoon. */
export function tasteAnalysisHref(
  webtoonId: string,
  title: string,
  options?: TasteAnalysisOptions
): string {
  const qs = new URLSearchParams({
    webtoonId,
    title,
  });
  if (options?.source) qs.set("source", options.source);
  return `/onboarding/analyzing?${qs.toString()}`;
}

/**
 * Persist favorite + recent taste source + SELECTED log (non-blocking),
 * then return analyzing href. Call from click handlers before navigation.
 */
export function prepareTasteAnalysis(
  webtoonId: string,
  title: string,
  options?: TasteAnalysisOptions
): string {
  setFavoriteWebtoon(webtoonId, title);

  const origin = options?.origin ?? inferOrigin(options?.source);

  setRecentTasteSource({
    webtoonId,
    title,
    thumbnailUrl: options?.thumbnailUrl ?? null,
    platform: normalizePlatform(options?.platform),
    source: origin,
  });

  if (origin !== "WORLD_CUP") {
    trackWebtoonSelected(webtoonId, title);
  }

  void postWebtoonAction({
    sessionId: getSessionId(),
    targetWebtoonId: webtoonId,
    actionType: "SELECTED",
  }).catch(() => {
    /* never block UX */
  });
  return tasteAnalysisHref(webtoonId, title, options);
}
