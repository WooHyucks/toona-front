import { fetchWebtoonDetail } from "@/lib/api/webtoons";
import { isMobileUserAgent, resolveNaverOpenUrl } from "@/lib/naver-webtoon";
import {
  getOfficialUrl,
  normalizePlatform,
} from "@/lib/open-webtoon";
import type { WeekendOpenTarget } from "@/lib/analytics";
import type { WeekendPickWebtoon } from "@/types/api";

const officialUrlCache = new Map<string, string | null>();

export function pickThumbnailUrl(webtoon: WeekendPickWebtoon): string | null {
  return webtoon.thumbnailUrl?.trim() || webtoon.thumbnail?.trim() || null;
}

export async function resolvePickOfficialUrl(
  webtoon: WeekendPickWebtoon
): Promise<string | null> {
  const fromPayload = getOfficialUrl({
    id: webtoon.id,
    officialUrl: webtoon.officialUrl,
  });
  if (fromPayload) {
    officialUrlCache.set(webtoon.id, fromPayload);
    return fromPayload;
  }
  if (officialUrlCache.has(webtoon.id)) {
    return officialUrlCache.get(webtoon.id) ?? null;
  }
  try {
    const detail = await fetchWebtoonDetail(webtoon.id);
    const url = detail.officialUrl?.trim() || null;
    officialUrlCache.set(webtoon.id, url);
    return url;
  } catch {
    officialUrlCache.set(webtoon.id, null);
    return null;
  }
}

export function getCachedOfficialUrl(webtoonId: string): string | null {
  return officialUrlCache.get(webtoonId) ?? null;
}

export function weekendOpenTarget(opts: {
  platform: string | null | undefined;
  officialUrl: string | null | undefined;
  isMobile?: boolean;
}): WeekendOpenTarget {
  const platform = normalizePlatform(opts.platform);
  const isMobile = opts.isMobile ?? isMobileUserAgent();
  if (platform === "NAVER" && opts.officialUrl) {
    const resolved = resolveNaverOpenUrl({
      officialUrl: opts.officialUrl,
      isMobile,
    });
    return resolved.openTarget === "app_bridge" ? "app_bridge" : "web";
  }
  return "web";
}

export function weekendReadHref(opts: {
  platform: string | null | undefined;
  officialUrl: string | null | undefined;
  webtoonId: string;
  isMobile?: boolean;
}): string | null {
  const platform = normalizePlatform(opts.platform);
  if (platform === "KAKAO" && opts.webtoonId) {
    return `/viewer/${encodeURIComponent(opts.webtoonId)}`;
  }
  if (!opts.officialUrl) return null;
  if (platform === "NAVER") {
    const isMobile = opts.isMobile ?? isMobileUserAgent();
    return resolveNaverOpenUrl({
      officialUrl: opts.officialUrl,
      isMobile,
    }).url;
  }
  return opts.officialUrl;
}

