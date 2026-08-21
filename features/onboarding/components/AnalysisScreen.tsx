"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { fetchTasteAnalysis } from "@/lib/api/recommendations";
import { ToonaApiError } from "@/lib/api/client";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import {
  TasteRadarChart,
  hasValidRadarAxes,
} from "@/features/onboarding/components/TasteRadarChart";
import { ErrorState } from "@/components/common/ErrorState";
import { setFavoriteWebtoon } from "@/lib/session";
import { clearRecentTasteSource } from "@/lib/recentTasteSource";
import { recommendationHref } from "@/lib/recommendations-path";
import type { TasteAnalysisResponse } from "@/types/api";

export function AnalysisScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const webtoonId = searchParams.get("webtoonId");
  const titleParam = searchParams.get("title");
  const sourceParam = searchParams.get("source");

  const [data, setData] = useState<TasteAnalysisResponse | null>(null);
  const [phase, setPhase] = useState<"radar" | "summary" | "cta">("radar");
  const [visibleTags, setVisibleTags] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (webtoonId) {
      setFavoriteWebtoon(webtoonId, titleParam ?? undefined);
    }
  }, [webtoonId, titleParam]);

  const load = useCallback(async () => {
    if (!webtoonId) {
      setError("작품을 선택해주세요.");
      setErrorCode("not_found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCode(null);
    setData(null);
    setPhase("radar");
    setVisibleTags(0);

    try {
      const res = await fetchTasteAnalysis(webtoonId);
      setData(res);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err instanceof ToonaApiError) {
        if (err.status === 404 || err.code === "not_found") {
          clearRecentTasteSource();
          setError("최근 선택한 작품을 찾을 수 없어요.");
          setErrorCode("not_found");
        } else if (err.code === "untagged") {
          setError("이 작품은 아직 추천 준비 중이에요.");
          setErrorCode("untagged");
        } else {
          setError(err.message);
          setErrorCode(err.code);
        }
      } else {
        setError("취향을 분석하지 못했어요.");
        setErrorCode("analysis_failed");
      }
    }
  }, [webtoonId]);

  useEffect(() => {
    void load();
  }, [load, retryKey]);

  useEffect(() => {
    if (!data) return;
    const tags = data.analysis.tags ?? [];
    const hasRadar = hasValidRadarAxes(data.analysis.axes);
    const timers: number[] = [];

    if (reduceMotion) {
      setVisibleTags(tags.length);
      setPhase("cta");
      return;
    }

    const summaryAt = hasRadar ? 1100 : 200;
    const ctaAt = summaryAt + 450;

    timers.push(window.setTimeout(() => setPhase("summary"), summaryAt));

    tags.forEach((_, i) => {
      timers.push(
        window.setTimeout(
          () => setVisibleTags(i + 1),
          summaryAt + 80 + i * 100
        )
      );
    });

    timers.push(window.setTimeout(() => setPhase("cta"), ctaAt));

    return () => timers.forEach(clearTimeout);
  }, [data, reduceMotion]);

  const displayTitle =
    data?.selectedWebtoon.title ?? titleParam ?? "선택한 작품";
  const coverSrc = data?.selectedWebtoon.thumbnailUrl ?? null;
  const axes = data?.analysis.axes ?? [];
  const showRadar = hasValidRadarAxes(axes);

  if (error) {
    return (
      <ErrorState
        fullPage
        code={errorCode}
        title={error}
        onRetry={
          errorCode !== "untagged" && errorCode !== "not_found"
            ? () => setRetryKey((k) => k + 1)
            : undefined
        }
        secondaryAction={{
          label: "다른 작품 선택하기",
          onClick: () => router.push("/onboarding"),
        }}
      />
    );
  }

  return (
    <motion.div
      className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col bg-background px-4 pb-10 pt-6 sm:px-6 sm:pt-8 md:max-w-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-5 flex items-start gap-3.5 sm:mb-6 sm:gap-4">
        <div className="relative h-[96px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-elevated sm:h-[120px] sm:w-[80px]">
          <WebtoonCover src={coverSrc} fill className="object-cover" />
        </div>
        <div className="min-w-0 pt-0.5 sm:pt-1">
          <p className="text-[12px] text-muted-foreground sm:text-[13px]">
            취향 분석
          </p>
          <h1 className="mt-1 text-[20px] font-bold leading-snug tracking-[-0.02em] text-foreground sm:text-[22px]">
            {displayTitle}을 좋아하셨군요
          </h1>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
            이 작품에서 이런 취향을 발견했어요
          </p>
        </div>
      </div>

      {loading ? (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3"
          role="status"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-[13px] text-muted-foreground">취향을 읽고 있어요</p>
        </div>
      ) : (
        <>
          {showRadar ? (
            <div className="mb-5 sm:mb-6">
              <TasteRadarChart axes={axes} animated />
            </div>
          ) : null}

          {(phase === "summary" || phase === "cta" || reduceMotion) &&
          data?.analysis.summary ? (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 whitespace-pre-line text-[15px] font-medium leading-relaxed text-foreground sm:mb-6 sm:text-[16px]"
            >
              {data.analysis.summary}
            </motion.p>
          ) : null}

          <ul className="mb-8 space-y-2.5 sm:space-y-3">
            {(data?.analysis.tags ?? []).map((tag, index) => (
              <AnimatePresence key={tag.code ?? tag.key ?? tag.label}>
                {visibleTags > index ? (
                  <motion.li
                    initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-[14px] text-foreground sm:text-[15px]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    {tag.label}
                  </motion.li>
                ) : null}
              </AnimatePresence>
            ))}
          </ul>

          {phase === "cta" || reduceMotion ? (
            <motion.button
              type="button"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                router.push(
                  recommendationHref(webtoonId!, {
                    source: sourceParam,
                    title: displayTitle,
                  })
                );
              }}
              className="mt-auto flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground"
            >
              이번 주말 볼 TOP3 보기
            </motion.button>
          ) : null}
        </>
      )}
    </motion.div>
  );
}
