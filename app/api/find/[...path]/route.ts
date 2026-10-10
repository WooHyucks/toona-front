import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
/** Find calls OpenAI — allow longer than Next rewrite’s ~30s default. */
export const maxDuration = 90;

const UPSTREAM = (
  process.env.TOONA_API_INTERNAL_BASE || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const PROXY_TIMEOUT_MS = 85_000;

async function proxyFind(
  request: Request,
  pathParts: string[]
): Promise<Response> {
  const incoming = new URL(request.url);
  const target = `${UPSTREAM}/api/find/${pathParts.join("/")}${incoming.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const requestId = request.headers.get("x-request-id");
  if (requestId) headers.set("x-request-id", requestId);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const upstream = await fetch(target, {
      ...init,
      signal: controller.signal,
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    const aborted =
      err instanceof Error &&
      (err.name === "AbortError" || /aborted/i.test(err.message));
    return NextResponse.json(
      {
        error: aborted ? "upstream_timeout" : "upstream_error",
        message: aborted
          ? "웹툰 찾기 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요."
          : "웹툰 찾기 서버에 연결하지 못했어요.",
      },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyFind(request, path);
}

export async function POST(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyFind(request, path);
}
