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

/**
 * Start Amplitude as early as possible on the client.
 * Safe to call multiple times — shares one init promise.
 */
export function initAmplitude(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (initPromise) return initPromise;

  if (!AMPLITUDE_API_KEY) {
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
    if (!AMPLITUDE_API_KEY) return;

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
 * Legacy shim — CustomEvent only.
 * Does NOT forward to Amplitude. See AMPLITUDE.md for events that do.
 */
export function track(event: string, properties?: Props) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent("toona:analytics", {
        detail: { event, properties: properties ?? {} },
      })
    );
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

/** 6. TOONA home successfully shown */
export function trackHomeView() {
  sendOnce("home_view", "home_view");
}

/** Unused: recommendation CTA no longer creates a lifetime collection. */
export function trackLifetimeCollectionCreated(
  sourceWebtoonId: string,
  sourceTitle: string
) {
  send("lifetime_collection_created", { sourceWebtoonId, sourceTitle });
}

/** Unused while home lifetime section is commented out. */
export function trackLifetimeWebtoonAdded(webtoonId: string, title: string) {
  send("lifetime_webtoon_added", { webtoonId, title });
}

/** Official-platform open (CLICKED API is separate and unchanged) */
export function trackWebtoonClicked(properties: {
  platform: "naver";
  openTarget: "app_bridge" | "web_fallback";
  webtoonId: string;
  naverTitleId?: string | null;
}) {
  const props = {
    platform: properties.platform,
    openTarget: properties.openTarget,
    webtoonId: properties.webtoonId,
    naverTitleId: properties.naverTitleId ?? undefined,
  };
  track("webtoon_clicked", props);
  send("webtoon_clicked", props);
}

export type WeekendVideoType = "shorts" | "review";
export type WeekendOpenTarget = "app_bridge" | "web";

type WeekendPickBase = {
  webtoonId: string;
  title: string;
  position: number;
  label: string;
  weekKey: string;
};

/** Weekend Picks modal actually opened (auto or reopen) */
export function trackWeekendPicksView(weekKey: string, pickCount: number) {
  sendOnce(`weekend_picks_view:${weekKey}`, "weekend_picks_view", {
    weekKey,
    pickCount,
  });
}

/** A pick card entered the viewport */
export function trackWeekendPickImpression(props: WeekendPickBase) {
  sendOnce(
    `weekend_pick_impression:${props.weekKey}:${props.webtoonId}`,
    "weekend_pick_impression",
    props
  );
}

export function trackWeekendReviewOpen(
  props: WeekendPickBase & {
    videoId: string;
    videoType: WeekendVideoType;
  }
) {
  send("weekend_review_open", props);
}

export function trackWeekendReviewPlay(
  props: WeekendPickBase & {
    videoId: string;
    videoType: WeekendVideoType;
  }
) {
  send("weekend_review_play", props);
}

export function trackWeekendReviewClose(
  props: WeekendPickBase & {
    videoId?: string;
    videoType?: WeekendVideoType;
  }
) {
  send("weekend_review_close", props);
}

export function trackWeekendDirectReadClick(
  props: WeekendPickBase & {
    platform: string;
    openTarget: WeekendOpenTarget;
  }
) {
  send("weekend_direct_read_click", props);
}

export function trackWeekendReviewReadClick(
  props: WeekendPickBase & {
    platform: string;
    openTarget: WeekendOpenTarget;
    videoId?: string;
    videoType?: WeekendVideoType;
  }
) {
  send("weekend_review_read_click", props);
}

export function trackWeekendPersonalizeClick(weekKey: string) {
  send("weekend_personalize_click", { weekKey });
}

type RecReadProps = {
  webtoonId: string;
  title: string;
  episodeCount?: number | null;
  serializationStatus?: string | null;
  platform?: string | null;
};

export function trackBestRecommendationReadClick(props: RecReadProps) {
  send("best_recommendation_read_click", {
    webtoonId: props.webtoonId,
    title: props.title,
    episodeCount: props.episodeCount ?? undefined,
    serializationStatus: props.serializationStatus ?? undefined,
    platform: props.platform ?? undefined,
  });
}

export function trackAlternativeRecommendationReadClick(props: RecReadProps) {
  send("alternative_recommendation_read_click", {
    webtoonId: props.webtoonId,
    title: props.title,
    episodeCount: props.episodeCount ?? undefined,
    serializationStatus: props.serializationStatus ?? undefined,
    platform: props.platform ?? undefined,
  });
}

export function trackWeekendPicksButtonClick(weekKey?: string) {
  send("weekend_picks_button_click", { weekKey: weekKey || undefined });
}

type FindBase = {
  session_id?: string;
  turn_number?: number;
};

export function trackFindPageView() {
  sendOnce("find_page_view", "find_page_view");
}

/** MVP: Find page entered (once per JS session). */
export function trackFindViewed() {
  sendOnce("find_viewed", "find_viewed");
}

export function trackFindStarted(
  props: FindBase & { input_length?: number; memory_length?: number }
) {
  send("find_started", {
    ...props,
    memory_length: props.memory_length ?? props.input_length,
    attempt: 1,
  });
}

export function trackFindCandidatesShown(
  props: FindBase & {
    candidate_count: number;
    verified_count?: number;
    thumbnail_count?: number;
    official_url_count?: number;
  }
) {
  send("find_candidates_shown", props);
}

export function trackFindCandidateRejected(
  props: FindBase & { candidate_count: number }
) {
  send("find_candidate_rejected", props);
}

export function trackFindAllCandidatesRejected(
  props: FindBase & { candidate_count: number }
) {
  send("find_all_candidates_rejected", props);
}

export function trackFindRefined(
  props: FindBase & { attempt?: number; memory_length?: number }
) {
  send("find_refined", props);
}

export function trackFindNeedMoreInfo(
  props: FindBase & { attempt?: number }
) {
  send("find_need_more_info", props);
}

/** MVP: NEED_MORE_INFO UI shown (deduped per session + attempt). */
export function trackFindNeedMoreInfoShown(
  props: FindBase & { attempt: number }
) {
  sendOnce(
    `find_need_more_info_shown:${props.session_id ?? ""}:${props.attempt}`,
    "find_need_more_info_shown",
    { attempt: props.attempt, session_id: props.session_id }
  );
}

/** MVP: candidate / similar result UI shown (deduped per session + attempt + type). */
export function trackFindResultShown(props: {
  result_type: "candidate" | "similar";
  result_count: number;
  attempt: number;
  session_id?: string;
}) {
  sendOnce(
    `find_result_shown:${props.session_id ?? ""}:${props.attempt}:${props.result_type}`,
    "find_result_shown",
    {
      result_type: props.result_type,
      result_count: props.result_count,
      attempt: props.attempt,
      session_id: props.session_id,
    }
  );
}

/** MVP: core result CTA — confirm or official link. */
export function trackFindResultClicked(props: {
  action: "confirmed" | "official_clicked";
  result_type: "candidate" | "similar";
  title?: string | null;
  platform?: string | null;
  attempt: number;
  session_id?: string;
}) {
  send("find_result_clicked", {
    action: props.action,
    result_type: props.result_type,
    title: props.title ?? undefined,
    platform: props.platform ?? undefined,
    attempt: props.attempt,
    session_id: props.session_id,
  });
}

/** MVP: Find API failure (no raw messages). */
export function trackFindError(props: {
  attempt: number;
  error_type: string;
  session_id?: string;
}) {
  send("find_error", {
    attempt: props.attempt,
    error_type: props.error_type,
    session_id: props.session_id,
  });
}

export function trackFindSimilarShown(
  props: FindBase & {
    attempt?: number;
    similar_count: number;
    verified_count?: number;
    thumbnail_count?: number;
    official_url_count?: number;
  }
) {
  send("find_similar_shown", props);
}

export function trackFindSimilarClicked(
  props: FindBase & {
    title?: string;
    platform?: string | null;
    position?: number;
    attempt?: number;
  }
) {
  send("find_similar_clicked", {
    session_id: props.session_id,
    turn_number: props.turn_number,
    attempt: props.attempt,
    title: props.title,
    platform: props.platform ?? undefined,
    position: props.position,
  });
}

export function trackFindContinueAfterSimilar(
  props: FindBase & { attempt?: number }
) {
  send("find_continue_after_similar", props);
}

export function trackFindConfirmed(
  props: FindBase & {
    platform?: string | null;
    webtoon_title?: string;
    verified?: boolean;
  }
) {
  const payload = {
    session_id: props.session_id,
    turn_number: props.turn_number,
    platform: props.platform ?? undefined,
    webtoon_title: props.webtoon_title,
    title: props.webtoon_title,
    verified: props.verified,
  };
  send("find_confirmed", payload);
  send("find_candidate_confirmed", payload);
}

export function trackFindOfficialClicked(
  props: FindBase & { platform?: string | null; webtoon_title?: string }
) {
  send("find_official_clicked", {
    session_id: props.session_id,
    turn_number: props.turn_number,
    platform: props.platform ?? undefined,
    webtoon_title: props.webtoon_title,
    title: props.webtoon_title,
  });
}

export function trackFindRecommendationClicked(
  props: FindBase & { source?: string }
) {
  send("find_recommendation_clicked", props);
  send("find_recommendation_cta_clicked", {
    ...props,
    source: props.source ?? "find_success",
  });
}

export function trackFindToonapickCtaClicked(
  props: FindBase & {
    source?: string;
    find_status?: string;
    attempt?: number;
  }
) {
  send("find_toonapick_cta_clicked", {
    source: props.source ?? "find",
    find_status: props.find_status,
    attempt: props.attempt,
    session_id: props.session_id,
    turn_number: props.turn_number,
  });
}

export function trackFindToonapickShown(
  props: FindBase & {
    source?: string;
    find_status?: string;
    attempt?: number;
    pick_count?: number;
  }
) {
  send("find_toonapick_shown", {
    source: props.source ?? "find",
    find_status: props.find_status,
    attempt: props.attempt,
    session_id: props.session_id,
    turn_number: props.turn_number,
    pick_count: props.pick_count,
  });
}

export function trackFindToonapickClicked(
  props: FindBase & {
    source?: string;
    find_status?: string;
    attempt?: number;
    title?: string;
    platform?: string | null;
    position?: number;
  }
) {
  send("find_toonapick_clicked", {
    source: props.source ?? "find",
    find_status: props.find_status,
    attempt: props.attempt,
    session_id: props.session_id,
    turn_number: props.turn_number,
    title: props.title,
    platform: props.platform ?? undefined,
    position: props.position,
  });
}
