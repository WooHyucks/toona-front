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

/** Production FastAPI (Cloud Run). Used when env is missing in production builds. */
export const PRODUCTION_TOONA_API_BASE =
  "https://toona-api-610048355251.asia-northeast3.run.app";

export function getApiBase(): string {
  // Browser + local/dev: same-origin so phones on LAN hit Next, which rewrites
  // to FastAPI. Avoids NEXT_PUBLIC_TOONA_API_BASE=127.0.0.1 (the phone itself).
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    return "";
  }

  const fromEnv = process.env.NEXT_PUBLIC_TOONA_API_BASE?.trim().replace(
    /\/$/,
    ""
  );
  if (fromEnv) return fromEnv;

  // NEXT_PUBLIC_* is inlined at build time. If unset on Vercel, never fall
  // back to localhost in production — that breaks the deployed client.
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_TOONA_API_BASE;
  }

  return "http://127.0.0.1:8000";
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
