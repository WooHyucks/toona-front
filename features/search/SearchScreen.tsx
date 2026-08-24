"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, Search, X } from "lucide-react";
import { DesktopContent, DesktopPageHeader } from "@/features/shell/DesktopContent";
import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import { WebtoonThumbnail } from "@/features/webtoons/components/WebtoonThumbnail";
import { searchWebtoons } from "@/lib/api/webtoons";
import { ToonaApiError } from "@/lib/api/client";
import { toUiPlatform, toUiStatus } from "@/lib/api/mappers";
import { STATUS_LABELS } from "@/features/webtoons/model";
import { useWebtoonSheet } from "@/features/shell/WebtoonSheetContext";
import { fetchWebtoonDetail } from "@/lib/api/webtoons";
import { mapDetailToWebtoon } from "@/lib/api/mappers";
import { getEpisodeLabel } from "@/lib/episode";
import type { SearchWebtoonItem } from "@/types/api";

const POPULAR = ["화산귀환", "참교육", "나 혼자만 레벨업", "로맨스", "무협"];

export function SearchScreen() {
  const { openWebtoon } = useWebtoonSheet();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchWebtoonItem[]>([]);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "empty" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (value: string) => {
    const q = value.trim();
    if (!q) {
      setItems([]);
      setStatus("idle");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");

    try {
      const res = await searchWebtoons({
        q,
        limit: 20,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setItems(res.items);
      setStatus(res.items.length === 0 ? "empty" : "success");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMessage(
        err instanceof ToonaApiError ? err.message : "검색에 실패했어요."
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => runSearch(query), 300);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  async function openItem(item: SearchWebtoonItem) {
    try {
      const detail = await fetchWebtoonDetail(item.id);
      openWebtoon(mapDetailToWebtoon(detail));
    } catch {
      openWebtoon({
        id: item.id,
        platform: toUiPlatform(item.platform),
        platformId: "",
        title: item.title,
        author: item.author,
        thumbnailUrl: item.thumbnailUrl,
        platformUrl: null,
        primaryDay: null,
        daysOfWeek: [],
        rank: null,
        primaryGenre: (item.genres?.[0] as never) ?? null,
        genres: (item.genres ?? []) as never,
        sourceTags: [],
        description: null,
        status: toUiStatus(item.status),
        scrapedAt: "",
      });
    }
  }

  return (
    <div className="pb-10 md:pb-16">
      <DesktopContent narrow={!query}>
        <DesktopPageHeader
          title="검색"
          description="제목, 작가로 작품을 찾아보세요"
        />

        <form
          role="search"
          className="mb-8 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 md:py-3.5 lg:max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(query);
          }}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <label htmlFor="browse-search" className="sr-only">
            웹툰 검색
          </label>
          <input
            id="browse-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목, 작가 검색"
            className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground md:text-[15px]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="검색어 지우기"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : null}
        </form>

        {status === "idle" ? (
          <div>
            <p className="mb-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-primary" />
              인기 검색
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => setQuery(title)}
                  className="rounded-full bg-card px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground"
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {status === "loading" ? (
          <div
            className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            role="status"
            aria-label="검색 중"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[3/4] animate-pulse rounded-xl bg-card" />
                <div className="mt-2 h-3 w-[80%] animate-pulse rounded bg-card" />
              </div>
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <div className="rounded-2xl bg-card px-4 py-8 text-center">
            <p className="text-[14px] text-foreground">{errorMessage}</p>
            <button
              type="button"
              onClick={() => runSearch(query)}
              className="mt-4 min-h-11 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
            >
              다시 시도
            </button>
          </div>
        ) : null}

        {status === "empty" ? (
          <p className="py-10 text-center text-[14px] text-muted-foreground">
            검색 결과가 없어요. 다른 표현으로 찾아보세요.
          </p>
        ) : null}

        {status === "success" ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item, index) => {
              const episode = getEpisodeLabel({
                status: item.status,
                latestEpisodeNumber: item.latestEpisodeNumber,
                totalEpisodeCount: item.totalEpisodeCount,
              });
              const st = toUiStatus(item.status);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className="w-full rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <WebtoonThumbnail
                    src={item.thumbnailUrl}
                    title={item.title}
                    platform={toUiPlatform(item.platform)}
                    priority={index < 6}
                    seed={item.id}
                  />
                  <p className="mt-2 line-clamp-2 min-h-[2.4em] text-[12px] font-semibold leading-tight text-foreground">
                    {item.title}
                  </p>
                  <div className="mt-1 flex min-w-0 items-center gap-1.5">
                    <PlatformBadge
                      platform={toUiPlatform(item.platform)}
                      size="xs"
                      label="desktop"
                    />
                    <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
                      {episode ??
                        (st ? STATUS_LABELS[st] : item.author) ??
                        ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </DesktopContent>
    </div>
  );
}
