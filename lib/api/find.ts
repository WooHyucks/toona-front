import { apiFetch } from "@/lib/api/client";
import type {
  ConfirmFindCandidateRequest,
  ConfirmFindResponse,
  ContinueFindSessionRequest,
  CreateFindSessionRequest,
  FindSessionResponse,
  FindTurnResponse,
} from "@/types/api";

export async function createFindSession(
  body: CreateFindSessionRequest,
  signal?: AbortSignal
): Promise<FindTurnResponse> {
  return apiFetch<FindTurnResponse>("/api/find/sessions", {
    method: "POST",
    body: JSON.stringify({
      message: body.message,
      guestToken: body.guestToken ?? null,
    }),
    signal,
  });
}

export async function continueFindSession(
  sessionId: string,
  body: ContinueFindSessionRequest,
  signal?: AbortSignal
): Promise<FindTurnResponse> {
  return apiFetch<FindTurnResponse>(
    `/api/find/sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        message: body.message,
        rejectedCandidateIds: body.rejectedCandidateIds ?? [],
      }),
      signal,
    }
  );
}

export async function confirmFindCandidate(
  sessionId: string,
  body: ConfirmFindCandidateRequest,
  signal?: AbortSignal
): Promise<ConfirmFindResponse> {
  return apiFetch<ConfirmFindResponse>(
    `/api/find/sessions/${encodeURIComponent(sessionId)}/confirm`,
    {
      method: "POST",
      body: JSON.stringify({ candidateId: body.candidateId }),
      signal,
    }
  );
}

export async function getFindSession(
  sessionId: string,
  signal?: AbortSignal
): Promise<FindSessionResponse> {
  return apiFetch<FindSessionResponse>(
    `/api/find/sessions/${encodeURIComponent(sessionId)}`,
    { signal }
  );
}
