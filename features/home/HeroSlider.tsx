"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { HomeHeroView } from "@/lib/api/home";
import { openOfficialAndLog } from "@/lib/api/actions";
import {
  RECOMMENDATION_TYPE_LABEL,
  toUiPlatform,
} from "@/lib/api/mappers";
import { getSessionId } from "@/lib/session";
import { getEpisodeLabel } from "@/lib/episode";
import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import { cn } from "@/lib/utils";
import type { RecommendationItem } from "@/types/api";

const AUTO_MS = 4800;

function HeroAtmosphere({
  thumbnailUrl,
  dominantColor,
}: {
  thumbnailUrl: string | null;
  dominantColor: string | null;
}) {
  const tint = dominantColor || "#2a1f4d";

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 70% 20%, ${tint}66 0%, transparent 55%), linear-gradient(160deg, #12131a 0%, #0F1014 100%)`,
        }}
      />
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-[1.35] object-cover opacity-45 blur-2xl saturate-150 md:scale-[1.2] md:opacity-40 md:blur-3xl"
          referrerPolicy="no-referrer"
        />
      ) : null}
      {/* Soft vignette so art sits in atmosphere, not flat panel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(15,16,20,0.35) 55%, rgba(15,16,20,0.88) 100%)",
        }}
      />
    </>
  );
}

function HeroSlideContent({
  item,
  sourceTitle,
  sourceId,
  weekendCopy,
  priority,
}: {
  item: RecommendationItem;
  sourceTitle: string;
  sourceId: string;
  weekendCopy: boolean;
  priority?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const webtoon = item.webtoon;
  const hasUrl = Boolean(webtoon.officialUrl);
  const episode = getEpisodeLabel({
    status: webtoon.status,
    latestEpisodeNumber: webtoon.latestEpisodeNumber,
    totalEpisodeCount: webtoon.totalEpisodeCount,
  });
  const role =
    RECOMMENDATION_TYPE_LABEL[item.recommendationType] ??
    item.recommendationType;
  const headline = weekendCopy
    ? "이번 주말 정주행 추천"
    : `${sourceTitle}을 좋아했다면`;
  const reason = item.recommendationReason?.trim();

  function onCta() {
    openOfficialAndLog({
      officialUrl: webtoon.officialUrl,
      action: {
        sessionId: getSessionId(),
        sourceWebtoonId: sourceId,
        targetWebtoonId: webtoon.id,
        actionType: "CLICKED",
        recommendationType: item.recommendationType,
      },
    });
  }

  return (
    <div className="relative overflow-hidden rounded-[22px] bg-[#0F1014] ring-1 ring-white/[0.06] md:rounded-[28px]">
      {/* ── Mobile: cover-forward composition ── */}
      <div className="relative isolate md:hidden">
        <div className="relative min-h-[440px]">
          <HeroAtmosphere
            thumbnailUrl={webtoon.thumbnailUrl}
            dominantColor={webtoon.dominantColor}
          />

          <div
            className="absolute inset-x-0 bottom-0 h-[58%]"
            style={{
              background:
                "linear-gradient(to top, #0F1014 12%, rgba(15,16,20,0.92) 42%, rgba(15,16,20,0.35) 72%, transparent 100%)",
            }}
          />

          <div className="relative z-10 flex min-h-[440px] flex-col px-4 pb-5 pt-5">
            <motion.div
              className="mx-auto w-[148px] shrink-0"
              initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.08)]">
                <WebtoonCover
                  src={webtoon.thumbnailUrl || null}
                  alt={webtoon.title}
                  fill
                  priority={priority}
                  className="object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              className="mt-auto pt-5 text-center"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: reduceMotion ? 0 : 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <p className="text-[12px] font-medium tracking-[-0.01em] text-white/55">
                {headline}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-primary">
                {role}
              </p>
              <h2 className="mt-2 text-[24px] font-bold leading-[1.15] tracking-[-0.03em] text-white">
                {webtoon.title}
              </h2>

              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                <PlatformBadge
                  platform={toUiPlatform(String(webtoon.platform))}
                  variant="solid"
                />
                {episode ? (
                  <span className="text-[12px] text-white/55">{episode}</span>
                ) : null}
              </div>

              {reason ? (
                <p className="mx-auto mt-3 max-w-[20rem] line-clamp-2 text-[13px] leading-relaxed text-white/65">
                  {reason}
                </p>
              ) : null}

              <button
                type="button"
                disabled={!hasUrl}
                onClick={onCta}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[14px] font-semibold text-primary-foreground shadow-[0_10px_28px_-8px_rgba(95,52,254,0.65)] transition-transform active:scale-[0.98] disabled:opacity-40"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                지금 보러가기
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Desktop: cinematic split ── */}
      <div className="group relative hidden min-h-[360px] md:block lg:min-h-[400px]">
        <HeroAtmosphere
          thumbnailUrl={webtoon.thumbnailUrl}
          dominantColor={webtoon.dominantColor}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(15,16,20,0.97) 0%, rgba(15,16,20,0.78) 42%, rgba(15,16,20,0.28) 68%, rgba(15,16,20,0.55) 100%)",
          }}
        />

        <div className="relative z-10 grid min-h-[360px] grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)] items-center gap-6 px-8 py-9 lg:min-h-[400px] lg:gap-10 lg:px-11 lg:py-10">
          <motion.div
            className="min-w-0"
            initial={reduceMotion ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[13px] font-medium text-white/50">{headline}</p>
            <p className="mt-1.5 text-[12px] font-semibold tracking-wide text-primary">
              {role}
            </p>
            <h2 className="mt-3 max-w-xl text-[34px] font-bold leading-[1.12] tracking-[-0.035em] text-white lg:text-[40px]">
              {webtoon.title}
            </h2>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <PlatformBadge
                platform={toUiPlatform(String(webtoon.platform))}
                variant="solid"
                size="sm"
              />
              {episode ? (
                <span className="text-[13px] text-white/55">{episode}</span>
              ) : null}
            </div>

            {reason ? (
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65">
                {reason}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!hasUrl}
              onClick={onCta}
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-primary px-6 text-[14px] font-semibold text-primary-foreground shadow-[0_12px_32px_-10px_rgba(95,52,254,0.7)] transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              지금 보러가기
            </button>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-[260px] lg:max-w-[280px]"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.55,
              delay: reduceMotion ? 0 : 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div
              className="pointer-events-none absolute -inset-6 rounded-[40px] opacity-70 blur-2xl"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${webtoon.dominantColor || "rgba(124,92,252,0.35)"} 0%, transparent 70%)`,
              }}
              aria-hidden
            />
            <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.1)] transition-transform duration-500 motion-safe:group-hover:scale-[1.025]">
              <WebtoonCover
                src={webtoon.thumbnailUrl || null}
                alt={webtoon.title}
                fill
                priority={priority}
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function HeroSlider({ hero }: { hero: HomeHeroView }) {
  const slides = hero.slides;
  const reduceMotion = useReducedMotion();
  const multi = slides.length > 1;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: multi,
    align: "start",
  });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!multi || !emblaApi || reduceMotion || paused || userInteracted) return;
    const id = window.setInterval(() => {
      emblaApi.scrollNext();
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [multi, emblaApi, reduceMotion, paused, userInteracted]);

  function markManual() {
    setUserInteracted(true);
  }

  if (slides.length === 0) return null;

  const shellClass = "pb-1 pt-3 md:pb-3 md:pt-1";

  if (!multi) {
    return (
      <div className={shellClass}>
        <HeroSlideContent
          item={slides[0]}
          sourceTitle={hero.sourceTitle}
          sourceId={hero.sourceId}
          weekendCopy={hero.weekendCopy}
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={shellClass}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {slides.map((item, i) => (
              <div
                key={`${item.webtoon.id}-${item.recommendationType}`}
                className="min-w-0 shrink-0 grow-0 basis-full"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${slides.length}`}
              >
                <HeroSlideContent
                  item={item}
                  sourceTitle={hero.sourceTitle}
                  sourceId={hero.sourceId}
                  weekendCopy={hero.weekendCopy}
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-3 md:flex">
          <button
            type="button"
            aria-label="이전 추천"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65"
            onClick={() => {
              markManual();
              emblaApi?.scrollPrev();
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="다음 추천"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65"
            onClick={() => {
              markManual();
              emblaApi?.scrollNext();
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="mt-3.5 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="히어로 슬라이드"
      >
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`슬라이드 ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index
                ? "w-6 bg-primary"
                : "w-1.5 bg-white/25 hover:bg-white/40"
            )}
            onClick={() => {
              markManual();
              emblaApi?.scrollTo(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function FallbackHero() {
  return (
    <div className="pb-1 pt-3 md:pb-3 md:pt-1">
      <div className="relative overflow-hidden rounded-[22px] bg-card px-6 py-10 ring-1 ring-white/[0.06] md:rounded-[28px] md:px-10 md:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(80% 60% at 80% 0%, rgba(95,52,254,0.22) 0%, transparent 55%)",
          }}
        />
        <p className="relative text-[13px] font-medium text-muted-foreground">
          TOONA
        </p>
        <h2 className="relative mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[30px]">
          오늘은 어떤 작품을 볼까요?
        </h2>
        <p className="relative mt-2 max-w-md text-[14px] text-muted-foreground">
          아래에서 인기·장르별 작품을 둘러보세요.
        </p>
      </div>
    </div>
  );
}
