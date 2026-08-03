import { redirect } from "next/navigation";
import { recommendationHref } from "@/lib/recommendations-path";

type Props = {
  searchParams: {
    webtoonId?: string;
    title?: string;
    source?: string;
  };
};

/**
 * Legacy query-based result URL.
 * Redirects to shareable `/recommendations/[webtoonId]`.
 */
export default function OnboardingResultRedirectPage({ searchParams }: Props) {
  const webtoonId = searchParams.webtoonId?.trim();
  if (!webtoonId) {
    redirect("/onboarding");
  }
  redirect(
    recommendationHref(webtoonId, {
      source: searchParams.source,
      title: searchParams.title,
    })
  );
}
