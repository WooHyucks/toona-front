import { NextResponse } from "next/server";
import { getWebtoonById } from "@/lib/webtoons";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Props) {
  const webtoon = await getWebtoonById(params.id);
  if (!webtoon) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(webtoon);
}
