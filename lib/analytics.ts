import * as amplitude from "@amplitude/analytics-browser";

type Props = Record<string, string | number | boolean | null | undefined>;

type QueuedEvent = {
  event: string;
  properties?: Props;
};

/**
 * Must be a static `process.env.NEXT_PUBLIC_*` reference so Next.js inlines
 * the value at build time (Vercel Production build).
 */
const AMPLITUDE_API_KEY = (
  process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || ""
).trim();

const onceKeys = new Set<string>();
const queue: QueuedEvent[] = [];

let initPromise: Promise<boolean> | null = null;
let warnedMissingKey = false;

function cleanProps(
  properties?: Props
): Record<string, string | number | boolean> | undefined {
  if (!properties) return undefined;
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v === undefined || v === null) continue;
    cleaned[k] = v;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function warnMissingKey() {
  if (warnedMissingKey || typeof window === "undefined") return;
  warnedMissingKey = true;
  // eslint-disable-next-line no-console
  console.warn(
    "[toona:amplitude] API key empty in this build. " +
      "Vercel에 NEXT_PUBLIC_AMPLITUDE_API_KEY를 Production에 저장한 뒤 " +
      "반드시 Redeploy 해야 합니다. (저장만 하고 재배포 안 하면 이 경고가 납니다)"
  );
}

/**
 * Start Amplitude as early as possible on the client.
 * Safe to call multiple times — shares one init promise.
 */
export function initAmplitude(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (initPromise) return initPromise;

  if (!AMPLITUDE_API_KEY) {
    warnMissingKey();
    initPromise = Promise.resolve(false);
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await amplitude.init(AMPLITUDE_API_KEY, undefined, {
        autocapture: false,
        defaultTracking: false,
        flushIntervalMillis: 1000,
        flushQueueSize: 10,
      }).promise;

      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        amplitude.track(item.event, cleanProps(item.properties));
      }
      void amplitude.flush();
      return true;
    } catch {
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

function send(event: string, properties?: Props) {
  if (typeof window === "undefined") return;
  try {
    if (!AMPLITUDE_API_KEY) {
      warnMissingKey();
      return;
    }

    if (!initPromise) {
      queue.push({ event, properties });
      void initAmplitude();
      return;
    }

    void initAmplitude().then((ok) => {
      if (!ok) return;
      try {
        amplitude.track(event, cleanProps(properties));
        void amplitude.flush();
      } catch {
        /* never block UX */
      }
    });
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
export function track(event: string, properties?: Props) {
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
