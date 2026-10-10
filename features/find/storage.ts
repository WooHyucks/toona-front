const FIND_SESSION_KEY = "toona_find_session_id";

export function getStoredFindSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(FIND_SESSION_KEY);
  } catch {
    return null;
  }
}

export function storeFindSessionId(sessionId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FIND_SESSION_KEY, sessionId);
  } catch {
    /* ignore */
  }
}

export function clearStoredFindSessionId() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(FIND_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
