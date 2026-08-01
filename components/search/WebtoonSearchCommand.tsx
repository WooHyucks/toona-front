"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Webtoon } from "@/types/webtoon";

type WebtoonSearchCommandProps = {
  value: string;
  onChange: (value: string) => void;
  webtoons: Webtoon[];
  onPick: (webtoon: Webtoon) => void;
};

export function WebtoonSearchCommand({
  value,
  onChange,
  webtoons,
  onPick,
}: WebtoonSearchCommandProps) {
  const [open, setOpen] = useState(false);

  const suggestions = webtoons
    .filter((w) => {
      const q = value.trim().toLowerCase();
      if (!q) return false;
      return (
        w.title.toLowerCase().includes(q) ||
        (w.author?.toLowerCase().includes(q) ?? false)
      );
    })
    .slice(0, 8);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // allow click on suggestion
            setTimeout(() => setOpen(false), 150);
          }}
          placeholder="웹툰 제목을 검색해보세요"
          className="h-12 pl-10"
        />
      </div>

      {open && value.trim() ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border bg-card shadow-lg">
          <Command shouldFilter={false}>
            <CommandList>
              <CommandEmpty>찾는 작품이 아직 없어요</CommandEmpty>
              <CommandGroup heading="추천 검색">
                {suggestions.map((webtoon) => (
                  <CommandItem
                    key={webtoon.id}
                    value={webtoon.title}
                    onSelect={() => {
                      onPick(webtoon);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{webtoon.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {webtoon.author}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      ) : null}
    </div>
  );
}
