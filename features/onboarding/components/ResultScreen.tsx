"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { fetchRecommendations } from "@/lib/api/recommendations";
import { ToonaApiError } from "@/lib/api/client";
import { openOfficialAndLog } from "@/lib/api/actions";
import { RECOMMENDATION_TYPE_LABEL, toUiPlatform } from "@/lib/api/mappers";
import {
  completeOnboarding,
  getSessionId,
  setFavoriteWebtoon,
} from "@/lib/session";
import { track } from "@/lib/analytics";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import { getEpisodeLabel } from "@/lib/episode";
import type { RecommendationItem, RecommendationsResponse } from "@/types/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

function RecCard({
  item,
  sourceId,
  sessionId,
}: {
  item: RecommendationItem;
  sourceId: string;
  sessionId: string;
}) {
  const hasUrl = Boolean(item.webtoon.officialUrl);
  const episode = getEpisodeLabel({
    status: item.webtoon.status,
    latestEpisodeNumber: item.webtoon.latestEpisodeNumber,
    totalEpisodeCount: item.webtoon.totalEpisodeCount,
  });
  const tags = item.matchedTags.slice(0, 3);
  const reason = item.recommendationReason?.trim();

  return (
    <article className="rounded-2xl bg-card p-4">
      <div className="mb-3 flex items-start gap-3">
        <div
          className="relative w-[72px] shrink-0 overflow-hidden rounded-xl bg-elevated"
          style={{ aspectRatio: "2/3" }}
        >
          <WebtoonCover
            src={item.webtoon.thumbnailUrl || null}
            alt={item.webtoon.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-semibold text-primary">
            {RECOMMENDATION_TYPE_LABEL[item.recommendationType] ??
              item.recommendationType}
          </p>
          <h3 className="text-[16px] font-bold leading-snug text-foreground">
            {item.webtoon.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <PlatformBadge
              platform={toUiPlatform(String(item.webtoon.platform))}
            />
            {episode ? (
              <span className="text-[11px] text-muted-foreground">{episode}</span>
            ) : null}
          </div>
        </div>
      </div>

      {reason ? (
        <p className="mb-3 text-[14px] font-medium leading-relaxed text-foreground">
          {reason}
        </p>
      ) : null}

      {tags.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.code}
              className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary"
            >
              {tag.label}
            </span>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        disabled={!hasUrl}
        onClick={() =>
          openOfficialAndLog({
            officialUrl: item.webtoon.officialUrl,
            action: {
              sessionId,
              sourceWebtoonId: sourceId,
              targetWebtoonId: item.webtoon.id,
              actionType: "CLICKED",
              recommendationType: item.recommendationType,
            },
          })
        }
        className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground disabled:opacity-40"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        {hasUrl ? "공식 플랫폼에서 보기" : "링크를 준비 중이에요"}
      </button>
    </article>
  );
}

function SectionBlock({
  title,
  items,
  sourceId,
  sessionId,
}: {
  title: string;
  items: RecommendationItem[];
  sourceId: string;
  sessionId: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[16px] font-semibold text-foreground">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <RecCard
            key={`${item.recommendationType}-${item.webtoon.id}`}
            item={item}
            sourceId={sourceId}
            sessionId={sessionId}
          />
        ))}
      </div>
    </section>
  );
}

export function ResultScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const webtoonId = searchParams.get("webtoonId");
  const title = searchParams.get("title") ?? "";
  const source = searchParams.get("source");

  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "empty" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    if (!webtoonId) {
      setErrorMessage("작품을 선택해주세요.");
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
        const empty =
          (res.sections?.completed?.length ?? 0) === 0 &&
          (res.sections?.ongoing?.length ?? 0) === 0;
        setStatus(empty ? "empty" : "success");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        if (err instanceof ToonaApiError) {
          setErrorMessage(err.message);
          setErrorCode(err.code);
        } else {
          setErrorMessage("추천을 불러오지 못했어요.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [webtoonId]);

  function goHome() {
    if (webtoonId) {
      setFavoriteWebtoon(webtoonId, title || data?.source.title);
      completeOnboarding(webtoonId, title || data?.source.title);
    }
    if (source === "world-cup") {
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
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="min-h-11 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
          >
            다른 작품 선택하기
          </button>
          {errorCode !== "untagged" && errorCode !== "not_found" ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-xl border border-border px-4 text-[13px] font-semibold text-foreground"
            >
              다시 시도
            </button>
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
      <p className="text-[12px] font-medium text-muted-foreground">추천 결과</p>
      <h1 className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-foreground">
        {data?.source.title ?? title}을 기준으로 골랐어요
      </h1>
      <p className="mt-2 text-[13px] text-muted-foreground">
        완결작과 연재작으로 나눠 보여드릴게요.
      </p>

      {status === "empty" ? (
        <div className="mt-10 rounded-2xl bg-card px-4 py-10 text-center">
          <p className="text-[15px] font-medium text-foreground">
            비슷한 작품을 아직 찾지 못했어요.
          </p>
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
          >
            다른 작품 선택하기
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <SectionBlock
            title="지금 정주행하기 좋은 완결작"
            items={data?.sections.completed ?? []}
            sourceId={webtoonId!}
            sessionId={sessionId}
          />
          <SectionBlock
            title="매주 기다려도 좋은 연재작"
            items={data?.sections.ongoing ?? []}
            sourceId={webtoonId!}
            sessionId={sessionId}
          />
        </div>
      )}

      {status !== "empty" ? (
        <button
          type="button"
          onClick={goHome}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground"
        >
          {source === "world-cup"
            ? "다른 웹툰도 찾아보기"
            : "TOONA 홈으로 가기"}
        </button>
      ) : null}
    </motion.div>
  );
}
