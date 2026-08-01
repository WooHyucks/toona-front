"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGroup } from "framer-motion";
import { TasteAnalysisStep } from "@/components/onboarding/TasteAnalysisStep";
import { WebtoonSelectionStep } from "@/components/onboarding/WebtoonSelectionStep";
import { ErrorState } from "@/components/common/ErrorState";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import type { Webtoon } from "@/types/webtoon";

type Step = "select" | "analyze";

type ToonaOnboardingProps = {
  webtoons: Webtoon[];
};

export function ToonaOnboarding({ webtoons }: ToonaOnboardingProps) {
  const router = useRouter();
  const { completeOnboarding } = useOnboardingStatus();
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<Webtoon | null>(null);
  const [error, setError] = useState(false);

  const runRecommendation = useCallback(async () => {
    if (!selected) return;

    try {
      const res = await fetch(
        `/api/recommend?id=${encodeURIComponent(selected.id)}&count=2`
      );
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      const ids = (data.recommendations as Webtoon[]).map((w) => w.id);
      completeOnboarding(selected.id, ids);
      router.replace(
        `/recommendations?source=${selected.id}&ids=${ids.join(",")}`
      );
    } catch {
      setError(true);
    }
  }, [completeOnboarding, router, selected]);

  const handleAnalysisComplete = useCallback(() => {
    void runRecommendation();
  }, [runRecommendation]);

  if (error) {
    return (
      <ErrorState
        title="추천을 만들지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        onRetry={() => {
          setError(false);
          setStep("select");
        }}
      />
    );
  }

  return (
    <LayoutGroup>
      {step === "select" ? (
        <WebtoonSelectionStep
          webtoons={webtoons}
          selected={selected}
          onSelect={setSelected}
          onConfirm={() => setStep("analyze")}
        />
      ) : selected ? (
        <TasteAnalysisStep
          webtoon={selected}
          onComplete={handleAnalysisComplete}
        />
      ) : null}
    </LayoutGroup>
  );
}
