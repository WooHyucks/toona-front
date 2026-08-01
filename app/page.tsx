"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  getFavoriteWebtoonId,
  isOnboardingCompleted,
} from "@/lib/session";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const completed = isOnboardingCompleted();
    const favoriteId = getFavoriteWebtoonId();
    if (completed && favoriteId) {
      router.replace("/home");
    } else {
      router.replace("/onboarding");
    }
  }, [router]);

  return <LoadingSpinner fullPage />;
}
