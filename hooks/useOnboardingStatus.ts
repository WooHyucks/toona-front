"use client";

import { useCallback, useEffect, useState } from "react";
import {
  completeOnboarding as persistComplete,
  getFavoriteWebtoonId,
  isOnboardingCompleted,
  resetOnboarding as persistReset,
} from "@/lib/session";

export type OnboardingStatus = {
  completed: boolean;
  sourceId: string | null;
  recommendationIds: string[];
  ready: boolean;
  completeOnboarding: (sourceId: string, recommendationIds?: string[]) => void;
  resetOnboarding: () => void;
};

export function useOnboardingStatus(): OnboardingStatus {
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sourceId, setSourceId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setCompleted(isOnboardingCompleted());
      setSourceId(getFavoriteWebtoonId());
    } catch {
      setCompleted(false);
    } finally {
      setReady(true);
    }
  }, []);

  const completeOnboarding = useCallback(
    (nextSourceId: string, _recommendationIds: string[] = []) => {
      persistComplete(nextSourceId);
      setCompleted(true);
      setSourceId(nextSourceId);
    },
    []
  );

  const resetOnboarding = useCallback(() => {
    persistReset();
    setCompleted(false);
    setSourceId(null);
  }, []);

  return {
    completed,
    sourceId,
    recommendationIds: [],
    ready,
    completeOnboarding,
    resetOnboarding,
  };
}
