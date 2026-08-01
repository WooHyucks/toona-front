"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { MobileBottomNavigation } from "@/components/home/MobileBottomNavigation";
import { FilterChips } from "@/components/search/FilterChips";
import { WebtoonSearchCommand } from "@/components/search/WebtoonSearchCommand";
import { WebtoonCard } from "@/components/webtoon/WebtoonCard";
import { WebtoonDetailSheet } from "@/components/webtoon/WebtoonDetailSheet";
import { useSavedWebtoons } from "@/hooks/useSavedWebtoons";
import { GENRE_LABELS, GENRE_ORDER, type Webtoon } from "@/types/webtoon";

type SearchClientProps = {
  webtoons: Webtoon[];
};

export function SearchClient({ webtoons }: SearchClientProps) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("전체");
  const [selected, setSelected] = useState<Webtoon | null>(null);
  const { isSaved, toggleSave } = useSavedWebtoons();

  const chips = ["전체", ...GENRE_ORDER.map((g) => GENRE_LABELS[g])];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return webtoons.filter((item) => {
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.author?.toLowerCase().includes(q) ?? false) ||
        (item.genre?.toLowerCase().includes(q) ?? false);

      const matchesGenre =
        genre === "전체" ||
        GENRE_LABELS[item.genre ?? ""] === genre ||
        item.genre === genre;

      return matchesQuery && matchesGenre;
    });
  }, [webtoons, query, genre]);

  return (
    <div className="min-h-[100dvh] pb-28 md:pb-10">
      <AppHeader showMy />
      <div className="mx-auto max-w-content space-y-4 px-4 py-4 sm:px-6">
        <WebtoonSearchCommand
          value={query}
          onChange={setQuery}
          webtoons={webtoons}
          onPick={(webtoon) => {
            setSelected(webtoon);
            setQuery(webtoon.title);
          }}
        />
        <FilterChips items={chips} value={genre} onChange={setGenre} />

        {filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="찾는 작품이 아직 없어요"
            actionLabel="필터 초기화"
            onAction={() => {
              setQuery("");
              setGenre("전체");
            }}
          />
        ) : (
          <div className="grid grid-cols-3 gap-x-2.5 gap-y-5 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {filtered.map((webtoon) => (
              <WebtoonCard
                key={webtoon.id}
                webtoon={webtoon}
                onOpen={setSelected}
              />
            ))}
          </div>
        )}
      </div>

      <WebtoonDetailSheet
        webtoon={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        saved={selected ? isSaved(selected.id) : false}
        onToggleSave={() => selected && toggleSave(selected.id)}
      />
      <MobileBottomNavigation />
    </div>
  );
}
