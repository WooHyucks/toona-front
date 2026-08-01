"use client";

import { Suspense } from "react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DiscoverScreen } from "@/features/discover/DiscoverScreen";

export default function DiscoverPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DiscoverScreen />
    </Suspense>
  );
}
