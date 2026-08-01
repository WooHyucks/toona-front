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

/** Open official URL first, then fire-and-forget action log. */
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
