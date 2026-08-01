"use client";

import { Suspense } from "react";
import { WorldCupScreen } from "@/features/world-cup/components/WorldCupScreen";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function WorldCupPageClient() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage label="월드컵 준비 중" />}>
      <WorldCupScreen />
    </Suspense>
  );
}
