import type { ApiError } from "@/types/api";

export class ToonaApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string;

  constructor(code: string, message: string, status: number, requestId = "") {
    super(message);
    this.name = "ToonaApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_TOONA_API_BASE?.replace(/\/$/, "") ??
    "http://localhost:8000"
  );
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return {
      error: "internal_error",
      message: "응답을 해석하지 못했어요.",
      requestId: "",
    };
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });

  const data = await parseJson(res);

  if (!res.ok) {
    const err = data as Partial<ApiError>;
    throw new ToonaApiError(
      err.error ?? "internal_error",
      err.message ?? "잠시 후 다시 시도해주세요.",
      res.status,
      err.requestId ?? ""
    );
  }

  return data as T;
}
