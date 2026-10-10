import type { Metadata } from "next";
import { FindScreen } from "@/features/find/FindScreen";
import {
  DEFAULT_OG_IMAGE_PATH,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "그 웹툰 뭐였지? | TOONA FIND",
  description:
    "제목이 생각 나지 않아도 괜찮아요. 기억나는 장면과 등장인물만으로 웹툰을 찾아드려요.",
  pathname: "/find",
  image: DEFAULT_OG_IMAGE_PATH,
  openGraphTitle: "그 웹툰 뭐였지? | TOONA",
  openGraphDescription: "기억나는 내용만 말해주세요. 조각난 기억만 있어도 찾아드려요.",
  robots: { index: true, follow: true },
});

export default function FindPage() {
  return <FindScreen />;
}
