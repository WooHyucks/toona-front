"use client";

import { useCallback, useEffect, useState } from "react";
import { ToonaHome } from "@/features/home/HomeScreen";
import { HomePageSkeleton } from "@/features/rankings/components/RankingRailSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getHomeBundle, type HomeBundle } from "@/lib/api/home";
import { getFavoriteWebtoonId } from "@/lib/session";
import { trackHomeView } from "@/lib/analytics";
import { useT } from "@/lib/i18n/LocaleProvider";

export function HomeClient() {
  const t = useT();
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

  useEffect(() => {
    if (status !== "success") return;
    trackHomeView();
  }, [status]);

  if (status === "loading") return <HomePageSkeleton />;
  if (status === "error" || !bundle) {
    return (
      <ErrorState
        fullPage
        title={t("home.loadFailed")}
        description={t("home.loadFailedDesc")}
        onRetry={() => setRetryKey((k) => k + 1)}
      />
    );
  }

  return <ToonaHome {...bundle} />;
}
