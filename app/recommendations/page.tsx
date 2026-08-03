import { redirect } from "next/navigation";
import { recommendationHref } from "@/lib/recommendations-path";

type Props = {
  searchParams: { source?: string; ids?: string; webtoonId?: string };
};

/**
 * Legacy `/recommendations?source=` → shareable `/recommendations/[webtoonId]`.
 */
export default function RecommendationsIndexPage({ searchParams }: Props) {
  const sourceId = searchParams.webtoonId || searchParams.source;
  if (!sourceId) {
    redirect("/onboarding");
  }
  redirect(recommendationHref(sourceId));
}
