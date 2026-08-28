"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { fetchRecommendations } from "@/lib/api/recommendations";
import { ToonaApiError } from "@/lib/api/client";
import {
  completeOnboarding,
  getSessionId,
  setFavoriteWebtoon,
} from "@/lib/session";
import { track, trackRecommendationViewed } from "@/lib/analytics";
import { RecommendationShareButton } from "@/features/recommendations/RecommendationShareButton";
import { CreateLifetimeCollectionCta } from "@/features/lifetime/CreateLifetimeCollectionCta";
import {
  AlternativeRecommendationCard,
  BestRecommendationCard,
} from "@/features/recommendations/BestFirstResult";
import {
  hasRecommendationResults,
  pickAlternativeRecommendations,
  pickBestRecommendation,
} from "@/lib/recommendations-result";
import type { RecommendationsResponse } from "@/types/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";

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
  const fromShare =
    entrySource === "share" || entrySource === "shared-recommendation";

  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "empty" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [sessionId, setSessionId] = useState("");

  const best = useMemo(() => pickBestRecommendation(data), [data]);
  const alternatives = useMemo(
    () => pickAlternativeRecommendations(data, best),
    [data, best]
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
      setErrorMessage("작품을 선택해주세요.");
      setErrorCode("not_found");
      setStatus("error");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const sid = getSessionId();
        const res = await fetchRecommendations(webtoonId, sid);
        if (cancelled) return;
        setData(res);
        setStatus(hasRecommendationResults(res) ? "success" : "empty");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        if (err instanceof ToonaApiError) {
          if (err.status === 404 || err.code === "not_found") {
            setErrorMessage("추천 기준 작품을 찾을 수 없어요.");
            setErrorCode("not_found");
          } else if (err.code === "untagged") {
            setErrorMessage("이 작품은 아직 추천 준비 중이에요.");
            setErrorCode("untagged");
          } else {
            setErrorMessage(err.message);
            setErrorCode(err.code);
          }
        } else {
          setErrorMessage("추천을 불러오지 못했어요.");
          setErrorCode("network_error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [webtoonId]);

  const sourceTitle = data?.source.title ?? titleHint ?? "선택한 작품";

  function goPickWebtoon() {
    track("shared_recommendation_home_clicked", {
      sourceWebtoonId: webtoonId,
      action: "pick_webtoon",
    });
    router.push("/onboarding?source=shared-recommendation");
  }

  function goRepickWebtoon() {
    if (fromShare) {
      goPickWebtoon();
      return;
    }
    router.push("/onboarding");
  }

  function goBrowseHome() {
    track("shared_recommendation_home_clicked", {
      sourceWebtoonId: webtoonId,
      action: "browse_home",
    });
    router.push("/home#home-browse");
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
    router.push("/home");
  }

  if (status === "loading") {
    return <LoadingSpinner fullPage label="추천을 고르는 중" />;
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <p className="text-[16px] font-semibold text-foreground">{errorMessage}</p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          {errorCode === "untagged"
            ? "다른 웹툰을 골라주세요."
            : "내가 재밌게 본 웹툰을 골라볼 수 있어요."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="min-h-11 rounded-xl px-4 text-[13px] font-semibold"
            onClick={goPickWebtoon}
          >
            {errorCode === "untagged"
              ? "다른 웹툰 고르기"
              : "내가 재밌게 본 웹툰 고르기"}
          </Button>
          {errorCode !== "untagged" && errorCode !== "not_found" ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl px-4 text-[13px] font-semibold"
              onClick={() => window.location.reload()}
            >
              다시 시도
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto min-h-[100dvh] w-full max-w-lg bg-background px-4 pb-12 pt-6 md:max-w-xl md:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button
        type="button"
        onClick={goRepickWebtoon}
        className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        웹툰 다시 고르기
      </button>
      <p className="text-[12px] font-medium text-muted-foreground">
        {fromShare ? "추천 결과" : `${sourceTitle}을 기준으로 골랐어요`}
      </p>
      <h1 className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-foreground">
        {fromShare
          ? `${sourceTitle}을 재미있게 봤다면`
          : "이번 주말엔 이거 보세요"}
      </h1>

      {status === "empty" || !best ? (
        <div className="mt-10 rounded-2xl bg-card px-4 py-10 text-center">
          <p className="text-[15px] font-medium text-foreground">
            비슷한 작품을 아직 찾지 못했어요.
          </p>
          <Button
            type="button"
            className="mt-4 min-h-11 rounded-xl px-4 text-[13px] font-semibold"
            onClick={goPickWebtoon}
          >
            다른 작품 선택하기
          </Button>
        </div>
      ) : (
        <div className="mt-5">
          <BestRecommendationCard
            item={best}
            sourceId={webtoonId}
            sessionId={sessionId}
            fromShare={fromShare}
          />
          {alternatives.length > 0 ? (
            <section className="mt-6">
              <h2 className="mb-3 text-[14px] font-semibold text-muted-foreground">
                다른 선택지
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {alternatives.map((item) => (
                  <AlternativeRecommendationCard
                    key={`${item.recommendationType}-${item.webtoon.id}`}
                    item={item}
                    sourceId={webtoonId}
                    sessionId={sessionId}
                    fromShare={fromShare}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {status !== "empty" && best ? (
        <div className="mt-6 space-y-3">
          {fromShare ? (
            <>
              <RecommendationShareButton
                sourceWebtoonId={webtoonId}
                sourceTitle={sourceTitle}
              />
              <Button
                type="button"
                className="min-h-12 w-full rounded-2xl text-[15px] font-semibold"
                onClick={goPickWebtoon}
              >
                내가 재밌게 본 웹툰도 골라보기
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full rounded-2xl text-[14px] font-semibold"
                onClick={goBrowseHome}
              >
                다른 웹툰 둘러보기
              </Button>
            </>
          ) : (
            <>
              <CreateLifetimeCollectionCta
                sourceWebtoonId={data?.source.id || webtoonId}
                sourceTitle={sourceTitle}
                onSkipHome={goHome}
                skipLabel="홈으로 가기"
              />
              <RecommendationShareButton
                sourceWebtoonId={webtoonId}
                sourceTitle={sourceTitle}
              />
            </>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}
