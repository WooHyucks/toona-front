const SESSION_KEY = "toona_session_id";
const FAVORITE_ID_KEY = "toona_favorite_webtoon_id";
const FAVORITE_TITLE_KEY = "toona_favorite_webtoon_title";
const ONBOARDING_COMPLETED_KEY = "toona_onboarding_completed";

/** Legacy keys — migrated once */
const LEGACY_COMPLETED = "toona.onboarding.completed";
const LEGACY_SOURCE = "toona.onboarding.sourceId";

function migrateLegacy() {
  if (typeof window === "undefined") return;
  try {
    if (
      !localStorage.getItem(ONBOARDING_COMPLETED_KEY) &&
      localStorage.getItem(LEGACY_COMPLETED) === "true"
    ) {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    }
    const legacySource = localStorage.getItem(LEGACY_SOURCE);
    if (legacySource && !localStorage.getItem(FAVORITE_ID_KEY)) {
      localStorage.setItem(FAVORITE_ID_KEY, legacySource);
    }
  } catch {
    /* ignore */
  }
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `session-${Date.now()}`;
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `session-${Date.now()}`;
  }
}

export function getFavoriteWebtoonId(): string | null {
  if (typeof window === "undefined") return null;
  migrateLegacy();
  try {
    return localStorage.getItem(FAVORITE_ID_KEY);
  } catch {
    return null;
  }
}

export function getFavoriteWebtoonTitle(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(FAVORITE_TITLE_KEY);
  } catch {
    return null;
  }
}

export function setFavoriteWebtoon(id: string, title?: string) {
  localStorage.setItem(FAVORITE_ID_KEY, id);
  if (title) localStorage.setItem(FAVORITE_TITLE_KEY, title);
}

export function isOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return false;
  migrateLegacy();
  try {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
}

export function completeOnboarding(webtoonId: string, title?: string) {
  setFavoriteWebtoon(webtoonId, title);
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
}

export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  localStorage.removeItem(FAVORITE_ID_KEY);
  localStorage.removeItem(FAVORITE_TITLE_KEY);
  // keep session id
}
