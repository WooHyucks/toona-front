"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { DesktopContent } from "@/features/shell/DesktopContent";
import { WebtoonSelectionCard } from "@/features/webtoons/components/WebtoonCards";
import type { Webtoon } from "@/features/webtoons/model";
import { prepareTasteAnalysis } from "@/lib/taste-flow";

type SelectionScreenProps = {
  webtoons: Webtoon[];
  error?: boolean;
  onRetry?: () => void;
};

export function SelectionScreen({
  webtoons,
  error = false,
  onRetry,
}: SelectionScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillId = searchParams.get("prefill");

  const initialSelected = useMemo(
    () => webtoons.find((w) => w.id === prefillId) ?? null,
    [prefillId, webtoons]
  );

  const [selected, setSelected] = useState<Webtoon | null>(initialSelected);

  if (error) {
    return (
      <ErrorState
        title="웹툰을 불러오지 못했어요."
        description="잠시 후 다시 시도해주세요."
        onRetry={onRetry ?? (() => router.refresh())}
      />
    );
  }

  if (webtoons.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="아직 등록된 웹툰이 없어요."
        description="데이터가 추가되면 이곳에서 선택할 수 있어요."
      />
    );
  }

  return (
    <motion.div
      className="flex min-h-[100dvh] flex-col bg-background md:mx-auto md:max-w-4xl lg:max-w-5xl"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
    >
      <DesktopContent className="max-w-none px-5 md:px-8">
        <div className="pb-5 pt-14 md:pt-16 lg:pt-20">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-primary">
            취향 분석
          </p>
          <h2 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-foreground md:text-[30px] lg:text-[32px]">
            가장 좋아하는
            <br className="md:hidden" />
            <span className="hidden md:inline"> </span>
            웹툰을 골라주세요
          </h2>
          <p className="mt-2 text-[13px] text-muted-foreground md:text-[14px]">
            하나만 선택하면 AI가 나머지를 분석해요
          </p>
        </div>
      </DesktopContent>

      <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-hide md:px-8 lg:px-12">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 md:gap-3 lg:grid-cols-6 lg:gap-4 xl:grid-cols-7">
          {webtoons.map((webtoon) => (
            <WebtoonSelectionCard
              key={webtoon.id}
              webtoon={webtoon}
              selected={selected?.id === webtoon.id}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-background px-5 pb-10 pt-3 md:px-8 md:pb-12">
        <div className="mx-auto max-w-md md:max-w-lg">
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              router.push(
                prepareTasteAnalysis(selected.id, selected.title, {
                  origin: "HOME",
                  source: "home",
                  thumbnailUrl: selected.thumbnailUrl,
                  platform: selected.platform,
                })
              );
            }}
            className={`w-full rounded-2xl py-4 text-[15px] font-semibold transition-all duration-200 md:py-[18px] md:text-[16px] ${
              selected
                ? "bg-primary text-primary-foreground"
                : "cursor-not-allowed bg-elevated text-muted-foreground"
            }`}
          >
            {selected ? "선택 완료" : "웹툰을 선택해주세요"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
