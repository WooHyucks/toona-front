"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ALL_DAYS,
  ALL_GENRES,
  DAY_LABEL,
  GENRE_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  type DayOfWeek,
  type Platform,
  type ToonaGenre,
  type WebtoonStatus,
} from "@/features/webtoons/model";
import { cn } from "@/lib/utils";

export type DetailFilterState = {
  platforms: Platform[];
  genres: ToonaGenre[];
  days: DayOfWeek[];
  statuses: WebtoonStatus[];
};

type WebtoonFilterDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DetailFilterState;
  onChange: (value: DetailFilterState) => void;
};

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((entry) => entry !== item)
    : [...list, item];
}

export function WebtoonFilterDrawer({
  open,
  onOpenChange,
  value,
  onChange,
}: WebtoonFilterDrawerProps) {
  const reset = () => {
    onChange({ platforms: [], genres: [], days: [], statuses: [] });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>상세 필터</DrawerTitle>
        </DrawerHeader>

        <div className="space-y-5 overflow-y-auto px-5 pb-2">
          <FilterGroup title="플랫폼">
            {(Object.keys(PLATFORM_LABELS) as Platform[]).map((platform) => (
              <FilterChip
                key={platform}
                label={PLATFORM_LABELS[platform]}
                active={value.platforms.includes(platform)}
                onClick={() =>
                  onChange({
                    ...value,
                    platforms: toggle(value.platforms, platform),
                  })
                }
              />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup title="장르">
            {ALL_GENRES.map((genre) => (
              <FilterChip
                key={genre}
                label={GENRE_LABELS[genre]}
                active={value.genres.includes(genre)}
                onClick={() =>
                  onChange({
                    ...value,
                    genres: toggle(value.genres, genre),
                  })
                }
              />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup title="요일">
            {ALL_DAYS.map((day) => (
              <FilterChip
                key={day}
                label={DAY_LABEL[day]}
                active={value.days.includes(day)}
                onClick={() =>
                  onChange({
                    ...value,
                    days: toggle(value.days, day),
                  })
                }
              />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup title="연재 상태">
            {(Object.keys(STATUS_LABELS) as WebtoonStatus[]).map((status) => (
              <FilterChip
                key={status}
                label={STATUS_LABELS[status]}
                active={value.statuses.includes(status)}
                onClick={() =>
                  onChange({
                    ...value,
                    statuses: toggle(value.statuses, status),
                  })
                }
              />
            ))}
          </FilterGroup>
        </div>

        <DrawerFooter>
          <Button type="button" variant="secondary" onClick={reset}>
            필터 초기화
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            적용하기
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-xl px-3 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-card text-muted-foreground"
      )}
    >
      {label}
    </button>
  );
}
