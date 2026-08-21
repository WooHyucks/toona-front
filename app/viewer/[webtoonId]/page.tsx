import type { Metadata } from "next";
import { WebtoonViewerClient } from "@/features/viewer/WebtoonViewerClient";

type Props = {
  params: { webtoonId: string };
};

export const metadata: Metadata = {
  title: "웹툰 보기 | TOONA",
  robots: { index: false, follow: false },
};

export default function WebtoonViewerPage({ params }: Props) {
  const webtoonId = params.webtoonId?.trim() ?? "";
  return <WebtoonViewerClient webtoonId={webtoonId} />;
}
