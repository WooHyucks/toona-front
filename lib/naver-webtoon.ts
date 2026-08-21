export type NaverOpenTarget = "app_bridge" | "web_fallback";

const NAVER_COMIC_HOSTS = new Set([
  "comic.naver.com",
  "m.comic.naver.com",
]);

const TITLE_ID_QUERY = /^\d+$/;

/**
 * Extract Naver Webtoon titleId from an official platform URL.
 * Does not invent custom URL schemes.
 */
export function extractNaverTitleId(
  url: string | null | undefined
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (!NAVER_COMIC_HOSTS.has(host)) {
      // Still allow titleId query on unexpected naver comic subdomains
      if (!host.endsWith("comic.naver.com")) return null;
    }
    const fromQuery = parsed.searchParams.get("titleId")?.trim() ?? "";
    if (TITLE_ID_QUERY.test(fromQuery)) return fromQuery;
  } catch {
    /* fall through to regex */
  }

  const match = trimmed.match(/[?&]titleId=(\d+)/);
  return match?.[1] ?? null;
}

export function naverAppLaunchBridgeUrl(titleId: string): string {
  const params = new URLSearchParams({
    titleId,
    type: "ARTICLE_LIST",
  });
  return `https://m.comic.naver.com/external/appLaunchBridge?${params.toString()}`;
}

export function isMobileUserAgent(userAgent?: string | null): boolean {
  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!ua) return false;
  return /Android|iPhone|iPad|iPod/i.test(ua);
}

export function resolveNaverOpenUrl(opts: {
  officialUrl: string;
  isMobile: boolean;
}): {
  url: string;
  openTarget: NaverOpenTarget;
  naverTitleId: string | null;
} {
  const naverTitleId = extractNaverTitleId(opts.officialUrl);
  if (opts.isMobile && naverTitleId) {
    return {
      url: naverAppLaunchBridgeUrl(naverTitleId),
      openTarget: "app_bridge",
      naverTitleId,
    };
  }
  return {
    url: opts.officialUrl,
    openTarget: "web_fallback",
    naverTitleId,
  };
}
