import { redirect } from "next/navigation";

type Props = {
  searchParams: { source?: string; ids?: string };
};

/** Legacy route — redirect to the current onboarding result flow. */
export default function RecommendationsPage({ searchParams }: Props) {
  const sourceId = searchParams.source;
  if (!sourceId) {
    redirect("/onboarding");
  }
  redirect(
    `/onboarding/result?webtoonId=${encodeURIComponent(sourceId)}`
  );
}
