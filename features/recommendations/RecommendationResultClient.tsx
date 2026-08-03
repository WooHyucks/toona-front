"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResultScreen } from "@/features/onboarding/components/ResultScreen";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

type RecommendationResultClientProps = {
  webtoonId: string;
};

function RecommendationResultInner({
  webtoonId,
}: RecommendationResultClientProps) {
  const searchParams = useSearchParams();
  const entrySource = searchParams.get("source");
  const titleHint = searchParams.get("title");

  return (
    <ResultScreen
      webtoonId={webtoonId}
      entrySource={entrySource}
      titleHint={titleHint}
    />
  );
}

export function RecommendationResultClient({
  webtoonId,
}: RecommendationResultClientProps) {
  return (
    <Suspense fallback={<LoadingSpinner fullPage label="추천을 고르는 중" />}>
      <RecommendationResultInner webtoonId={webtoonId} />
    </Suspense>
  );
}
