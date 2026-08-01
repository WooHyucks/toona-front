import { track } from "@/lib/analytics";

export type TasteSourceOrigin = "WORLD_CUP" | "HOME" | "SHARED" | "SEO";

export interface RecentTasteSource {
  webtoonId: string;
  title: string;
  thumbnailUrl?: string | null;
  platform?: "NAVER" | "KAKAO" | null;
  source: TasteSourceOrigin;
  updatedAt: string;
}

export const RECENT_TASTE_SOURCE_KEY = "toona_recent_taste_source";
export const RECENT_TASTE_SOURCE_TTL_DAYS = 30;

const ORIGINS = new Set<TasteSourceOrigin>([
  "WORLD_CUP",
  "HOME",
  "SHARED",
  "SEO",
]);

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function normalizePlatform(
  platform: string | null | undefined
): "NAVER" | "KAKAO" | null {
  if (!platform) return null;
  const upper = platform.toUpperCase();
  if (upper === "KAKAO" || upper === "KAKAOPAGE") return "KAKAO";
  if (upper === "NAVER") return "NAVER";
  return null;
}

export function isRecentTasteSourceValid(
  value: unknown
): value is RecentTasteSource {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.webtoonId !== "string" || !v.webtoonId.trim()) return false;
  if (typeof v.title !== "string" || !v.title.trim()) return false;
  if (typeof v.updatedAt !== "string" || Number.isNaN(Date.parse(v.updatedAt))) {
    return false;
  }
  if (typeof v.source !== "string" || !ORIGINS.has(v.source as TasteSourceOrigin)) {
    return false;
  }
  return true;
}

function isExpired(updatedAt: string): boolean {
  const ts = Date.parse(updatedAt);
  if (Number.isNaN(ts)) return true;
  const ageMs = Date.now() - ts;
  return ageMs > RECENT_TASTE_SOURCE_TTL_DAYS * 24 * 60 * 60 * 1000;
}

export function clearRecentTasteSource() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(RECENT_TASTE_SOURCE_KEY);
  } catch {
    /* ignore */
  }
}

export function getRecentTasteSource(): RecentTasteSource | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(RECENT_TASTE_SOURCE_KEY);
    if (!raw) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      clearRecentTasteSource();
      return null;
    }
    if (!isRecentTasteSourceValid(parsed)) {
      clearRecentTasteSource();
      return null;
    }
    if (isExpired(parsed.updatedAt)) {
      clearRecentTasteSource();
      track("recent_taste_source_expired", {
        webtoonId: parsed.webtoonId,
        source: parsed.source,
      });
      return null;
    }
    return {
      webtoonId: parsed.webtoonId,
      title: parsed.title,
      thumbnailUrl: parsed.thumbnailUrl ?? null,
      platform: normalizePlatform(
        typeof parsed.platform === "string" ? parsed.platform : null
      ),
      source: parsed.source,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function setRecentTasteSource(
  input: Omit<RecentTasteSource, "updatedAt"> & { updatedAt?: string }
): void {
  if (!isBrowser()) return;
  try {
    const payload: RecentTasteSource = {
      webtoonId: input.webtoonId.trim(),
      title: input.title.trim(),
      thumbnailUrl: input.thumbnailUrl ?? null,
      platform: normalizePlatform(input.platform),
      source: input.source,
      updatedAt: input.updatedAt ?? new Date().toISOString(),
    };
    if (!isRecentTasteSourceValid(payload)) return;
    localStorage.setItem(RECENT_TASTE_SOURCE_KEY, JSON.stringify(payload));
    track("recent_taste_source_saved", {
      webtoonId: payload.webtoonId,
      source: payload.source,
    });
  } catch {
    /* never block UX */
  }
}
