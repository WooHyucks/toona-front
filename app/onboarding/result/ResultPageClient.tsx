"use client";

import { Suspense } from "react";
import { ResultScreen } from "@/features/onboarding/components/ResultScreen";

export default function ResultPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground">
          준비 중…
        </div>
      }
    >
      <ResultScreen />
    </Suspense>
  );
}
