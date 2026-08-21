"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PlatformBadge } from "@/features/webtoons/components/PlatformBadge";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import { searchWebtoons } from "@/lib/api/webtoons";
import { ToonaApiError } from "@/lib/api/client";
import { toUiPlatform, toUiStatus } from "@/lib/api/mappers";
import { GENRE_LABELS, STATUS_LABELS, type ToonaGenre } from "@/features/webtoons/model";
import type { SearchWebtoonItem } from "@/types/api";

type AddLifetimeWebtoonSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingIds: Set<string>;
  addingId: string | null;
  onPick: (item: SearchWebtoonItem) => void;
};

export function AddLifetimeWebtoonSheet({
  open,
  onOpenChange,
  existingIds,
  addingId,
  onPick,
}: AddLifetimeWebtoonSheetProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchWebtoonItem[]>([]);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "empty" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setItems([]);
      setStatus("idle");
      abortRef.current?.abort();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      abortRef.current?.abort();
      setItems([]);
      setStatus("idle");
      return;
    }

    const timer = window.setTimeout(async () => {
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
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[88dvh] max-w-app">
        <DrawerHeader className="pb-2">
          <DrawerTitle>내 인생 웹툰 추가</DrawerTitle>
          <DrawerDescription>
            정말 재밌게 본 작품을 찾아보세요.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-5 pb-2">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-elevated px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="웹툰 제목 검색"
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query ? (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            ) : null}
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {status === "idle" ? (
            <p className="py-10 text-center text-[13px] text-muted-foreground">
              제목으로 검색해 보세요.
            </p>
          ) : null}

          {status === "loading" ? (
            <div className="flex justify-center py-10" role="status" aria-label="검색 중">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : null}

          {status === "error" ? (
            <p className="py-10 text-center text-[13px] text-muted-foreground">
              {errorMessage}
            </p>
          ) : null}

          {status === "empty" ? (
            <p className="py-10 text-center text-[13px] text-muted-foreground">
              검색 결과가 없어요.
            </p>
          ) : null}

          {status === "success" ? (
            <ul className="space-y-1.5">
              {items.map((item) => {
                const already = existingIds.has(item.id);
                const busy = addingId === item.id;
                const st = toUiStatus(item.status);
                const genre =
                  item.genres[0] && item.genres[0] in GENRE_LABELS
                    ? GENRE_LABELS[item.genres[0] as ToonaGenre]
                    : null;
                const meta =
                  item.author ||
                  genre ||
                  (st ? STATUS_LABELS[st] : null);

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={already || Boolean(addingId)}
                      onClick={() => onPick(item)}
                      className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-elevated disabled:opacity-50"
                    >
                      <div className="relative h-[72px] w-[48px] shrink-0 overflow-hidden rounded-lg bg-elevated">
                        <WebtoonCover
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-foreground">
                          {item.title}
                        </p>
                        <div className="mt-1 flex min-w-0 items-center gap-1.5">
                          <PlatformBadge
                            platform={toUiPlatform(item.platform)}
                            size="xs"
                          />
                          {meta ? (
                            <span className="min-w-0 truncate text-[11px] text-muted-foreground">
                              {meta}
                            </span>
                          ) : null}
                        </div>
                        {already ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            이미 담겨 있어요
                          </p>
                        ) : null}
                      </div>
                      {busy ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
