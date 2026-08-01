"use client";

import { useCallback, useEffect, useState } from "react";
import { ToonaHome } from "@/features/home/HomeScreen";
import { HomePageSkeleton } from "@/features/rankings/components/RankingRailSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getHomeBundle, type HomeBundle } from "@/lib/api/home";
import { getFavoriteWebtoonId } from "@/lib/session";

export function HomeClient() {
  const [bundle, setBundle] = useState<HomeBundle | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [retryKey, setRetryKey] = useState(0);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const favoriteId = getFavoriteWebtoonId();
      const data = await getHomeBundle(favoriteId);
      setBundle(data);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, retryKey]);

  if (status === "loading") return <HomePageSkeleton />;
  if (status === "error" || !bundle) {
    return (
      <ErrorState
        fullPage
        title="홈을 불러오지 못했어요"
        description="네트워크나 백엔드 상태를 확인한 뒤 다시 시도해 주세요."
        onRetry={() => setRetryKey((k) => k + 1)}
      />
    );
  }

  return <ToonaHome {...bundle} />;
}
