import type { WebtoonActionRequest } from "@/types/api";
import { postWebtoonAction } from "@/lib/api/actions";
import { trackWebtoonClicked } from "@/lib/analytics";
import {
  extractNaverTitleId,
  isMobileUserAgent,
  resolveNaverOpenUrl,
} from "@/lib/naver-webtoon";

export type OpenWebtoonTarget = {
  id: string;
  platform?: string | null;
  officialUrl?: string | null;
  /** UI Webtoon model alias */
  platformUrl?: string | null;
};

type RouterLike = { push: (href: string) => void };

export function normalizePlatform(
  platform: string | null | undefined
): "KAKAO" | "NAVER" | null {
  if (!platform) return null;
  const upper = platform.toUpperCase();
  if (upper === "KAKAO") return "KAKAO";
  if (upper === "NAVER") return "NAVER";
  return null;
}

export function getOfficialUrl(webtoon: OpenWebtoonTarget): string | null {
  const url = webtoon.officialUrl ?? webtoon.platformUrl ?? null;
  const trimmed = url?.trim();
  return trimmed || null;
}

/** User-facing CTA copy — no “viewer / iframe” jargon. */
export function getOpenWebtoonCtaLabel(
  platform: string | null | undefined,
  opts?: {
    isMobile?: boolean;
    officialUrl?: string | null;
  }
): string {
  const p = normalizePlatform(platform);
  if (p === "KAKAO") return "웹툰 바로 보기";
  if (p === "NAVER") {
    const mobile = opts?.isMobile ?? false;
    const canBridge =
      mobile && Boolean(extractNaverTitleId(opts?.officialUrl ?? null));
    return canBridge ? "네이버웹툰 앱에서 보기" : "네이버웹툰에서 보기";
  }
  return "공식 플랫폼에서 보기";
}

function logAction(action: WebtoonActionRequest | undefined) {
  if (!action) return;
  void postWebtoonAction(action).catch(() => {
    /* never block navigation */
  });
}

function openNaverUrl(opts: {
  officialUrl: string;
  webtoonId: string;
  isMobile?: boolean;
}) {
  const isMobile = opts.isMobile ?? isMobileUserAgent();
  const resolved = resolveNaverOpenUrl({
    officialUrl: opts.officialUrl,
    isMobile,
  });

  trackWebtoonClicked({
    platform: "naver",
    openTarget: resolved.openTarget,
    webtoonId: opts.webtoonId,
    naverTitleId: resolved.naverTitleId,
  });

  if (resolved.openTarget === "app_bridge") {
    window.location.assign(resolved.url);
    return;
  }
  window.open(resolved.url, "_blank", "noopener,noreferrer");
}

/**
 * Platform-aware open:
 * - KAKAO → in-app `/viewer/[id]` (official URL in iframe)
 * - NAVER → mobile appLaunchBridge when titleId exists; else official web URL
 * - unknown → external if URL exists
 */
export function openWebtoon(opts: {
  webtoon: OpenWebtoonTarget;
  router: RouterLike;
  action?: WebtoonActionRequest;
}): boolean {
  const { webtoon, router, action } = opts;
  if (!webtoon.id) return false;

  const platform = normalizePlatform(webtoon.platform);
  const url = getOfficialUrl(webtoon);

  if (platform === "KAKAO") {
    logAction(action);
    router.push(`/viewer/${encodeURIComponent(webtoon.id)}`);
    return true;
  }

  if (!url) return false;

  if (platform === "NAVER") {
    logAction(action);
    openNaverUrl({ officialUrl: url, webtoonId: webtoon.id });
    return true;
  }

  window.open(url, "_blank", "noopener,noreferrer");
  logAction(action);
  return true;
}

export function openOfficialInNewTab(url: string | null | undefined) {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  window.open(trimmed, "_blank", "noopener,noreferrer");
  return true;
}

/** Naver official open with mobile app-bridge preference. */
export function openNaverOfficial(opts: {
  officialUrl: string | null | undefined;
  webtoonId: string;
}): boolean {
  const trimmed = opts.officialUrl?.trim();
  if (!trimmed) return false;
  openNaverUrl({ officialUrl: trimmed, webtoonId: opts.webtoonId });
  return true;
}
