import { NextResponse } from "next/server";
import { delay, getSimilarWebtoons } from "@/lib/webtoons";

export const dynamic = "force-dynamic";

/** @deprecated Prefer FastAPI GET /api/recommendations from the client */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const count = Number(searchParams.get("count") ?? "2");

  if (!id) {
    return NextResponse.json({ error: "Missing webtoon id" }, { status: 400 });
  }

  await delay(200);

  const { source, recommendations } = await getSimilarWebtoons(
    id,
    Number.isFinite(count) ? count : 2
  );

  if (!source) {
    return NextResponse.json({ error: "Webtoon not found" }, { status: 404 });
  }

  return NextResponse.json({
    source,
    recommendations,
    engine: "fastapi-proxy",
  });
}
