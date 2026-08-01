"use client";

import { WebtoonCard } from "@/features/webtoons/components/WebtoonCard";
import type { Webtoon } from "@/features/webtoons/model";

type WebtoonGridProps = {
  webtoons: Webtoon[];
  selectedId?: string | null;
  onOpen: (webtoon: Webtoon) => void;
};

export function WebtoonGrid({
  webtoons,
  selectedId,
  onOpen,
}: WebtoonGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 min-[480px]:grid-cols-4 min-[480px]:gap-2.5 md:grid-cols-5 md:gap-3 lg:grid-cols-6">
      {webtoons.map((webtoon) => (
        <WebtoonCard
          key={webtoon.id}
          webtoon={webtoon}
          selected={selectedId === webtoon.id}
          dimmed={!!selectedId && selectedId !== webtoon.id}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
