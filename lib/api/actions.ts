import { apiFetch } from "@/lib/api/client";
import type { WebtoonActionRequest } from "@/types/api";

export async function postWebtoonAction(
  body: WebtoonActionRequest
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/api/webtoon-actions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * @deprecated Prefer `openWebtoon` from `@/lib/open-webtoon` (platform-aware).
 * External-only helper kept for rare call sites without a router.
 */
export function openOfficialAndLog(opts: {
  officialUrl: string | null | undefined;
  action: WebtoonActionRequest;
}) {
  if (!opts.officialUrl) return false;
  window.open(opts.officialUrl, "_blank", "noopener,noreferrer");
  void postWebtoonAction(opts.action).catch(() => {
    /* never block navigation */
  });
  return true;
}
