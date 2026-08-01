import { apiFetch } from "@/lib/api/client";
import type {
  CreateWorldCupSessionRequest,
  SubmitWorldCupChoiceRequest,
  WorldCupChoiceResponse,
  WorldCupSessionResponse,
  WorldCupShareResult,
} from "@/types/api";

export async function createWorldCupSession(
  body: CreateWorldCupSessionRequest,
  signal?: AbortSignal
): Promise<WorldCupChoiceResponse> {
  return apiFetch<WorldCupChoiceResponse>("/api/world-cup/sessions", {
    method: "POST",
    body: JSON.stringify({
      sessionId: body.sessionId,
      mode: body.mode ?? "ACQUISITION",
    }),
    signal,
  });
}

export async function submitWorldCupChoice(
  worldCupId: string,
  body: SubmitWorldCupChoiceRequest,
  signal?: AbortSignal
): Promise<WorldCupChoiceResponse> {
  return apiFetch<WorldCupChoiceResponse>(
    `/api/world-cup/${encodeURIComponent(worldCupId)}/choices`,
    {
      method: "POST",
      body: JSON.stringify(body),
      signal,
    }
  );
}

export async function fetchWorldCupSession(
  worldCupId: string,
  signal?: AbortSignal
): Promise<WorldCupSessionResponse> {
  return apiFetch<WorldCupSessionResponse>(
    `/api/world-cup/${encodeURIComponent(worldCupId)}`,
    { signal }
  );
}

export async function fetchWorldCupResult(
  resultId: string,
  signal?: AbortSignal
): Promise<WorldCupShareResult> {
  return apiFetch<WorldCupShareResult>(
    `/api/world-cup/results/${encodeURIComponent(resultId)}`,
    { signal }
  );
}
