"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { fetchRecommendations } from "@/lib/api/recommendations";
import { ToonaApiError } from "@/lib/api/client";
import {
  completeOnboarding,
  getSessionId,
  setFavoriteWebtoon,
} from "@/lib/session";
import {
  track,
  trackRecommendationRefreshClicked,
  trackRecommendationRefreshFailed,
  trackRecommendationRefreshSucceeded,
  trackRecommendationRestartClicked,
  trackRecommendationResultViewed,
  trackRecommendationViewed,
} from "@/lib/analytics";
import { RecommendationShareButton } from "@/features/recommendations/RecommendationShareButton";
import { RecommendationPickCard } from "@/features/recommendations/BestFirstResult";
import {
  hasRecommendationResults,
  pickRecommendationSet,
} from "@/lib/recommendations-result";
import type { RecommendationsResponse } from "@/types/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";

export type ResultScreenProps = {
  webtoonId: string;
  /** Optional display hint before API returns */
  titleHint?: string | null;
  /**
   * Attribution / entry channel.
   * `share` → shared-recipient CTAs + analytics
   * `world-cup` → world-cup home CTA copy
   */
  entrySource?: string | null;
};

export function ResultScreen({
  webtoonId,
  titleHint = "",
  entrySource = null,
}: ResultScreenProps) {
  const router = useRouter();
  const t = useT();
  const { hrefWithLang } = useLocale();
  const reduceMotion = useReducedMotion();
  const fromShare =
    entrySource === "share" || entrySource === "shared-recommendation";

  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "empty" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);
  const [noMorePicks, setNoMorePicks] = useState(false);
  const picksTopRef = useRef<HTMLDivElement | null>(null);
  const excludedHistory = useRef<Set<string>>(new Set());

  const picks = useMemo(() => pickRecommendationSet(data), [data]);
  const shownIds = useMemo(
    () => picks.map((item) => item.webtoon.id).filter(Boolean),
    [picks]
  );

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    if (status !== "success" || !data) return;
    trackRecommendationViewed({
      sourceWebtoonId: data.source.id || webtoonId,
      sourceTitle: data.source.title,
      source: entrySource === "world-cup" ? "worldcup" : "direct",
    });
    trackRecommendationResultViewed({
      source_webtoon_id: data.source.id || webtoonId,
      refresh_count: refreshCount,
      pick_count: picks.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, data, webtoonId, entrySource]);

  useEffect(() => {
    if (!fromShare || !webtoonId) return;
    const params = new URLSearchParams(window.location.search);
    track("shared_recommendation_viewed", {
      sourceWebtoonId: webtoonId,
      referrer: document.referrer || null,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      source: entrySource,
    });
  }, [fromShare, webtoonId, entrySource]);

  useEffect(() => {
    if (!webtoonId) {
      setErrorMessage(t("result.pickWork"));
      setErrorCode("not_found");
      setStatus("error");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const sid = getSessionId();
        setSessionId(sid);
        const res = await fetchRecommendations(webtoonId, {
          sessionId: sid,
        });
        if (cancelled) return;
        setData(res);
        setStatus(hasRecommendationResults(res) ? "success" : "empty");
        setNoMorePicks(false);
        excludedHistory.current = new Set();
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        if (err instanceof ToonaApiError) {
          if (err.status === 404 || err.code === "not_found") {
            setErrorMessage(t("result.sourceNotFound"));
            setErrorCode("not_found");
          } else if (err.code === "untagged") {
            setErrorMessage(t("result.notReady"));
            setErrorCode("untagged");
          } else {
            setErrorMessage(err.message);
            setErrorCode(err.code);
          }
        } else {
          setErrorMessage(t("result.loadFailed"));
          setErrorCode("network_error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webtoonId]);

  function scrollToPicks() {
    picksTopRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  async function refreshRecommendations() {
    if (!webtoonId || refreshing) return;
    const sid = sessionId || getSessionId();
    setSessionId(sid);
    setRefreshing(true);
    setRefreshError("");
    setNoMorePicks(false);

    for (const id of shownIds) excludedHistory.current.add(id);
    const excludeWebtoonIds = Array.from(excludedHistory.current);

    trackRecommendationRefreshClicked({
      source_webtoon_id: webtoonId,
      refresh_count: refreshCount,
      exclude_count: excludeWebtoonIds.length,
    });

    try {
      const res = await fetchRecommendations(webtoonId, {
        sessionId: sid,
        refresh: true,
        excludeWebtoonIds,
      });
      const next = pickRecommendationSet(res);
      const nextIds = next.map((item) => item.webtoon.id);
      const allOverlap =
        next.length > 0 &&
        nextIds.every((id) => shownIds.includes(id)) &&
        nextIds.length === shownIds.length;

      if (!hasRecommendationResults(res) || next.length === 0 || allOverlap) {
        setNoMorePicks(true);
        trackRecommendationRefreshFailed({
          source_webtoon_id: webtoonId,
          refresh_count: refreshCount,
          reason: "no_new_picks",
        });
        return;
      }

      setData(res);
      setStatus("success");
      setRefreshCount((n) => n + 1);
      trackRecommendationRefreshSucceeded({
        source_webtoon_id: webtoonId,
        refresh_count: refreshCount + 1,
        pick_count: next.length,
      });
      requestAnimationFrame(() => scrollToPicks());
    } catch {
      setRefreshError(t("result.refreshFailed"));
      trackRecommendationRefreshFailed({
        source_webtoon_id: webtoonId,
        refresh_count: refreshCount,
        reason: "request_error",
      });
    } finally {
      setRefreshing(false);
    }
  }

  const sourceTitle = data?.source.title ?? titleHint ?? t("result.selectedWork");
  const sourceThumb = data?.source.thumbnailUrl ?? null;

  function goPickWebtoon() {
    trackRecommendationRestartClicked({
      source_webtoon_id: webtoonId,
      refresh_count: refreshCount,
    });
    if (fromShare) {
      track("shared_recommendation_home_clicked", {
        sourceWebtoonId: webtoonId,
        action: "pick_webtoon",
      });
      router.push(hrefWithLang("/onboarding?source=shared-recommendation"));
      return;
    }
    router.push(hrefWithLang("/onboarding"));
  }

  function goRepickWebtoon() {
    goPickWebtoon();
  }

  function goBrowseHome() {
    track("shared_recommendation_home_clicked", {
      sourceWebtoonId: webtoonId,
      action: "browse_home",
    });
    router.push(hrefWithLang("/home#home-browse"));
  }

  function goHome() {
    if (webtoonId) {
      setFavoriteWebtoon(webtoonId, sourceTitle);
      completeOnboarding(webtoonId, sourceTitle);
    }
    if (entrySource === "world-cup") {
      track("world_cup_home_clicked", {
        selectedWebtoonId: webtoonId,
        source: "world-cup",
      });
    }
    router.push(hrefWithLang("/home"));
  }

  if (status === "loading") {
    return <LoadingSpinner fullPage label={t("result.picking")} />;
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <p className="text-[16px] font-semibold text-foreground">{errorMessage}</p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          {errorCode === "untagged"
            ? t("result.pickOtherHint")
            : t("result.pickFavoriteHint")}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="min-h-11 rounded-xl px-4 text-[13px] font-semibold"
            onClick={goPickWebtoon}
          >
            {errorCode === "untagged"
              ? t("result.pickOther")
              : t("result.pickFavorite")}
          </Button>
          {errorCode !== "untagged" && errorCode !== "not_found" ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl px-4 text-[13px] font-semibold"
              onClick={() => window.location.reload()}
            >
              {t("common.retry")}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto min-h-[100dvh] w-full max-w-lg bg-background px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-5 md:max-w-xl md:px-6 md:pt-6"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button
        type="button"
        onClick={goRepickWebtoon}
        className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("result.pickAgain")}
      </button>

      <header className="mb-5">
        <h1 className="text-[22px] font-bold leading-snug tracking-[-0.03em] text-foreground md:text-[24px]">
          {fromShare
            ? t("result.shareLiked", { title: sourceTitle })
            : t("result.foundTitle")}
        </h1>
        {!fromShare ? (
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground md:text-[14px]">
            {t("result.foundSubtitle")}
          </p>
        ) : null}

        <div className="mt-3.5 flex items-center gap-3 rounded-2xl border border-border/70 bg-card/60 px-3 py-2.5">
          <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-elevated">
            <WebtoonCover
              src={sourceThumb}
              alt={sourceTitle}
              fill
              className="object-cover object-top"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t("result.youLiked")}
            </p>
            <p className="mt-0.5 truncate text-[14px] font-semibold text-foreground">
              {sourceTitle}
            </p>
          </div>
        </div>
      </header>

      <div ref={picksTopRef} className="scroll-mt-4" />

      {status === "empty" || picks.length === 0 ? (
        <div className="rounded-2xl bg-card px-4 py-10 text-center">
          <p className="text-[15px] font-medium text-foreground">
            {t("result.noSimilar")}
          </p>
          <Button
            type="button"
            className="mt-4 min-h-11 rounded-xl px-4 text-[13px] font-semibold"
            onClick={goPickWebtoon}
          >
            {t("analysis.pickOther")}
          </Button>
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${refreshCount}-${shownIds.join("-")}`}
              className="space-y-4"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {picks.map((item, index) => (
                <RecommendationPickCard
                  key={`${item.webtoon.id}-${item.recommendationType}-${refreshCount}`}
                  item={item}
                  sourceId={webtoonId}
                  sessionId={sessionId}
                  fromShare={fromShare}
                  position={index + 1}
                  refreshCount={refreshCount}
                  priority={index === 0}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          <section className="mt-8 space-y-3 border-t border-border/60 pt-7">
            <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
              {noMorePicks ? t("result.noMoreRefresh") : t("result.refreshHint")}
            </p>
            {!noMorePicks ? (
              <Button
                type="button"
                disabled={refreshing}
                className="min-h-12 w-full rounded-2xl text-[15px] font-semibold"
                onClick={() => void refreshRecommendations()}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  aria-hidden
                />
                {refreshing ? t("result.refreshing") : t("result.refreshPicks")}
              </Button>
            ) : null}
            {refreshError ? (
              <p className="text-center text-[12px] text-muted-foreground">
                {refreshError}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="min-h-12 w-full rounded-2xl text-[14px] font-semibold"
              onClick={goPickWebtoon}
            >
              {t("result.retaste")}
            </Button>
          </section>

          <div className="mt-5 space-y-3">
            {fromShare ? (
              <>
                <RecommendationShareButton
                  sourceWebtoonId={webtoonId}
                  sourceTitle={sourceTitle}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11 w-full rounded-2xl text-[14px] font-semibold"
                  onClick={goBrowseHome}
                >
                  {t("result.browseOther")}
                </Button>
              </>
            ) : (
              <>
                <RecommendationShareButton
                  sourceWebtoonId={webtoonId}
                  sourceTitle={sourceTitle}
                />
                <button
                  type="button"
                  onClick={goHome}
                  className="w-full py-2 text-center text-[12px] text-muted-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
                >
                  {t("result.goHome")}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
