"use client";

import { useCallback, useEffect, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toast, useToast } from "@/components/common/Toast";
import { WebtoonCover } from "@/features/webtoons/components/WebtoonCover";
import { AddLifetimeWebtoonSheet } from "@/features/lifetime/AddLifetimeWebtoonSheet";
import { useWebtoonSheet } from "@/features/shell/WebtoonSheetContext";
import {
  addLifetimeWebtoon,
  fetchLifetimeWebtoons,
  removeLifetimeWebtoon,
} from "@/lib/api/lifetime-webtoons";
import { mapLifetimeItemToWebtoon } from "@/lib/api/mappers";
import { trackLifetimeWebtoonAdded } from "@/lib/analytics";
import { getSessionId } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { LifetimeWebtoonItem, SearchWebtoonItem } from "@/types/api";

const CARD_W =
  "w-[118px] sm:w-[128px] md:w-[140px] lg:w-[148px] xl:w-[156px]";

export function LifetimeWebtoonsSection() {
  const { openWebtoon } = useWebtoonSheet();
  const { toast, showToast } = useToast();
  const [sessionId, setSessionId] = useState("");
  const [items, setItems] = useState<LifetimeWebtoonItem[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const load = useCallback(async (sid: string) => {
    try {
      const res = await fetchLifetimeWebtoons(sid);
      setItems(res.items ?? []);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const sid = getSessionId();
    setSessionId(sid);
    if (!sid) {
      setStatus("success");
      return;
    }
    void load(sid);
  }, [load]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("toona_lifetime_just_created") !== "1") {
        return;
      }
      sessionStorage.removeItem("toona_lifetime_just_created");
      showToast("첫 인생 웹툰을 담았어요.");
    } catch {
      /* ignore */
    }
  }, [showToast]);

  async function handleAdd(item: SearchWebtoonItem) {
    if (!sessionId || addingId) return;
    if (items.some((w) => w.id === item.id)) {
      showToast("이미 담겨 있어요.");
      return;
    }

    setAddingId(item.id);
    try {
      const res = await addLifetimeWebtoon({
        sessionId,
        webtoonId: item.id,
        source: "HOME",
      });
      if (res.alreadyExists) {
        showToast("이미 담겨 있어요.");
      } else {
        trackLifetimeWebtoonAdded(item.id, item.title);
        showToast("내 인생 웹툰에 추가했어요.");
      }
      setSheetOpen(false);
      await load(sessionId);
    } catch {
      showToast("인생 웹툰을 추가하지 못했어요.");
    } finally {
      setAddingId(null);
    }
  }

  async function handleRemove(webtoonId: string) {
    if (!sessionId) return;
    const prev = items;
    setItems((cur) => cur.filter((w) => w.id !== webtoonId));
    try {
      await removeLifetimeWebtoon({ sessionId, webtoonId });
      showToast("보관함에서 뺐어요.");
    } catch {
      setItems(prev);
      showToast("다시 시도해주세요.");
    }
  }

  if (status === "error") {
    return (
      <section className="mt-8 lg:mt-10" aria-labelledby="lifetime-title">
        <SectionHeading />
        <button
          type="button"
          onClick={() => {
            setStatus("loading");
            void load(sessionId);
          }}
          className="mt-2 text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          다시 불러오기
        </button>
      </section>
    );
  }

  return (
    <section className="mt-8 lg:mt-10" aria-labelledby="lifetime-title">
      <SectionHeading />

      {status === "loading" ? (
        <div className="mt-3 flex gap-3 overflow-hidden md:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(CARD_W, "shrink-0")}>
              <Skeleton className="aspect-[2/3] w-full rounded-xl bg-elevated md:rounded-2xl" />
              <Skeleton className="mt-2 h-3 w-4/5 bg-elevated" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-3">
          <p className="text-[13px] text-muted-foreground">
            인생 웹툰 하나부터 담아볼까요?
          </p>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" aria-hidden />
            인생 웹툰 추가하기
          </button>
        </div>
      ) : (
        <div className="relative -mx-4 mt-3 md:mx-0">
          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <div className="flex items-start gap-3 px-4 md:gap-4 md:px-0">
              {items.map((item) => (
                <LifetimeCard
                  key={item.id}
                  item={item}
                  onOpen={() => openWebtoon(mapLifetimeItemToWebtoon(item))}
                  onRemove={() => void handleRemove(item.id)}
                />
              ))}
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className={cn(
                  CARD_W,
                  "shrink-0 self-start p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
              >
                <div className="flex aspect-[2/3] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card text-muted-foreground md:rounded-2xl">
                  <Plus className="h-6 w-6 text-primary" aria-hidden />
                  <span className="mt-1.5 px-2 text-center text-[11px] font-medium">
                    추가
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <AddLifetimeWebtoonSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        existingIds={new Set(items.map((w) => w.id))}
        addingId={addingId}
        onPick={(item) => void handleAdd(item)}
      />
      <Toast message={toast} />
    </section>
  );
}

function SectionHeading() {
  return (
    <div>
      <h2
        id="lifetime-title"
        className="text-[15px] font-semibold tracking-[-0.01em] text-foreground md:text-[16px] lg:text-[17px]"
      >
        내 인생 웹툰
      </h2>
      <p className="mt-0.5 text-[12px] text-muted-foreground">
        내가 정말 재밌게 본 작품들
      </p>
    </div>
  );
}

function LifetimeCard({
  item,
  onOpen,
  onRemove,
}: {
  item: LifetimeWebtoonItem;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <div className={cn(CARD_W, "relative shrink-0")}>
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="relative mb-1.5 aspect-[2/3] w-full overflow-hidden rounded-xl bg-elevated md:mb-2 md:rounded-2xl">
          <WebtoonCover
            src={item.thumbnailUrl}
            alt={item.title}
            fill
            className="object-cover"
          />
        </div>
        <p className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground md:text-[13px]">
          {item.title}
        </p>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`${item.title} 메뉴`}
            className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onRemove}>
            인생 웹툰에서 빼기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
