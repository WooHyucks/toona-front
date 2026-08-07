import * as amplitude from "@amplitude/analytics-browser";

type Props = Record<string, string | number | boolean | null | undefined>;

let amplitudeReady = false;
const onceKeys = new Set<string>();

function apiKey(): string {
  return process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY?.trim() ?? "";
}

function ensureAmplitude(): boolean {
  if (typeof window === "undefined") return false;
  const key = apiKey();
  if (!key) return false;
  if (amplitudeReady) return true;
  try {
    amplitude.init(key, {
      defaultTracking: false,
    });
    amplitudeReady = true;
    return true;
  } catch {
    return false;
  }
}

function send(event: string, properties?: Props) {
  try {
    if (!ensureAmplitude()) return;
    const cleaned: Record<string, string | number | boolean> = {};
    if (properties) {
      for (const [k, v] of Object.entries(properties)) {
        if (v === undefined || v === null) continue;
        cleaned[k] = v;
      }
    }
    amplitude.track(event, cleaned);
  } catch {
    /* never block UX */
  }
}

/** Fire at most once per browser JS lifetime (survives React Strict Mode remount). */
function sendOnce(dedupeKey: string, event: string, properties?: Props) {
  if (onceKeys.has(dedupeKey)) return;
  onceKeys.add(dedupeKey);
  send(event, properties);
}

/**
 * Legacy shim — CustomEvent + console only.
 * Does NOT forward arbitrary events to Amplitude (only the 5 MVP events below).
 */
export function track(
  event: string,
  properties?: Props
) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent("toona:analytics", {
        detail: { event, properties: properties ?? {} },
      })
    );
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[toona:analytics]", event, properties ?? {});
    }
  } catch {
    /* never block UX */
  }
}

/** 1. General recommendation entry page shown */
export function trackPageView() {
  sendOnce("page_view", "page_view");
}

/** 2. User picked a source webtoon for analysis */
export function trackWebtoonSelected(webtoonId: string, title: string) {
  send("webtoon_selected", { webtoonId, title });
}

/** 3. World cup first match actually on screen */
export function trackWorldcupView() {
  sendOnce("worldcup_view", "worldcup_view");
}

/** 4. World cup finished with a winner */
export function trackWorldcupCompleted(
  winnerWebtoonId: string,
  winnerTitle: string
) {
  sendOnce(`worldcup_completed:${winnerWebtoonId}`, "worldcup_completed", {
    winnerWebtoonId,
    winnerTitle,
  });
}

/** 5. Recommendation TOP results shown successfully */
export function trackRecommendationViewed(input: {
  sourceWebtoonId: string;
  sourceTitle: string;
  source: "direct" | "worldcup";
}) {
  sendOnce(
    `recommendation_viewed:${input.sourceWebtoonId}:${input.source}`,
    "recommendation_viewed",
    input
  );
}
