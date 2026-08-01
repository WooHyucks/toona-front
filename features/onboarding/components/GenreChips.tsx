"use client";

import { cn } from "@/lib/utils";
import { GENRE_LABELS, QUICK_GENRE_CHIPS, type ToonaGenre } from "@/features/webtoons/model";

type GenreChipsProps = {
  value: ToonaGenre | "all";
  onChange: (value: ToonaGenre | "all") => void;
  className?: string;
};

export function GenreChips({ value, onChange, className }: GenreChipsProps) {
  return (
    <div
      className={cn(
        "scrollbar-hide flex gap-2 overflow-x-auto overscroll-x-contain",
        className
      )}
    >
      {QUICK_GENRE_CHIPS.map((chip) => {
        const label = chip === "all" ? "전체" : GENRE_LABELS[chip];
        const active = value === chip;

        return (
          <button
            key={chip}
            type="button"
            onClick={() => onChange(chip)}
            className={cn(
              "h-9 shrink-0 rounded-xl px-3 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
