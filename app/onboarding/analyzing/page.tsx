"use client";

import { Suspense } from "react";
import { AnalysisScreen } from "@/features/onboarding/components/AnalysisScreen";

export default function AnalyzingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground">
          준비 중…
        </div>
      }
    >
      <AnalysisScreen />
    </Suspense>
  );
}
