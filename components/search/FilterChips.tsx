"use client";

import { cn } from "@/lib/utils";

type FilterChipsProps = {
  items: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function FilterChips({
  items,
  value,
  onChange,
  className,
}: FilterChipsProps) {
  return (
    <div
      className={cn(
        "scrollbar-hide flex gap-2 overflow-x-auto overscroll-x-contain",
        className
      )}
    >
      {items.map((item) => {
        const active = value === item;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={cn(
              "h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
            )}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
