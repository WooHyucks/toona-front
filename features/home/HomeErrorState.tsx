"use client";

import { ErrorState } from "@/components/common/ErrorState";

type HomeErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

/** @deprecated Prefer ErrorState directly with onRetry */
export function HomeErrorState({
  title = "인기 웹툰을 불러오지 못했어요.",
  description = "잠시 후 다시 시도해주세요.",
  onRetry,
}: HomeErrorStateProps) {
  return (
    <ErrorState
      fullPage
      title={title}
      description={description}
      onRetry={onRetry}
    />
  );
}
