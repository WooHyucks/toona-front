import { apiFetch } from "@/lib/api/client";
import type {
  AddLifetimeWebtoonRequest,
  AddLifetimeWebtoonResponse,
  LifetimeWebtoonsResponse,
  RemoveLifetimeWebtoonResponse,
} from "@/types/api";

export async function fetchLifetimeWebtoons(
  sessionId: string,
  signal?: AbortSignal
): Promise<LifetimeWebtoonsResponse> {
  const qs = new URLSearchParams({ sessionId });
  return apiFetch<LifetimeWebtoonsResponse>(
    `/api/lifetime-webtoons?${qs.toString()}`,
    { signal }
  );
}

export async function addLifetimeWebtoon(
  body: AddLifetimeWebtoonRequest
): Promise<AddLifetimeWebtoonResponse> {
  return apiFetch<AddLifetimeWebtoonResponse>("/api/lifetime-webtoons", {
    method: "POST",
    body: JSON.stringify({
      sessionId: body.sessionId,
      userId: body.userId ?? null,
      webtoonId: body.webtoonId,
      source: body.source,
    }),
  });
}

export async function removeLifetimeWebtoon(opts: {
  sessionId: string;
  webtoonId: string;
}): Promise<RemoveLifetimeWebtoonResponse> {
  const qs = new URLSearchParams({ sessionId: opts.sessionId });
  return apiFetch<RemoveLifetimeWebtoonResponse>(
    `/api/lifetime-webtoons/${encodeURIComponent(opts.webtoonId)}?${qs.toString()}`,
    { method: "DELETE" }
  );
}
