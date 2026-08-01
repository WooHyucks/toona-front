"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { GENRE_LABELS, GENRE_ORDER } from "@/types/webtoon";
import { cn } from "@/lib/utils";

export type FilterState = {
  genres: string[];
  platforms: string[];
  statuses: string[];
  days: string[];
};

type FilterDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FilterState;
  onChange: (value: FilterState) => void;
};

const PLATFORMS = [
  { id: "naver", label: "네이버" },
  { id: "kakao", label: "카카오" },
];

const STATUSES = [
  { id: "ongoing", label: "연재중" },
  { id: "completed", label: "완결" },
];

const DAYS = [
  { id: "mon", label: "월" },
  { id: "tue", label: "화" },
  { id: "wed", label: "수" },
  { id: "thu", label: "목" },
  { id: "fri", label: "금" },
  { id: "sat", label: "토" },
  { id: "sun", label: "일" },
];

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function FilterDrawer({
  open,
  onOpenChange,
  value,
  onChange,
}: FilterDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>필터</DrawerTitle>
        </DrawerHeader>

        <div className="space-y-5 overflow-y-auto px-5 pb-2">
          <FilterGroup title="장르">
            {GENRE_ORDER.map((genre) => (
              <Chip
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

          <FilterGroup title="플랫폼">
            {PLATFORMS.map((platform) => (
              <Chip
                key={platform.id}
                label={platform.label}
                active={value.platforms.includes(platform.id)}
                onClick={() =>
                  onChange({
                    ...value,
                    platforms: toggle(value.platforms, platform.id),
                  })
                }
              />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup title="연재 상태">
            {STATUSES.map((status) => (
              <Chip
                key={status.id}
                label={status.label}
                active={value.statuses.includes(status.id)}
                onClick={() =>
                  onChange({
                    ...value,
                    statuses: toggle(value.statuses, status.id),
                  })
                }
              />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup title="요일">
            {DAYS.map((day) => (
              <Chip
                key={day.id}
                label={day.label}
                active={value.days.includes(day.id)}
                onClick={() =>
                  onChange({
                    ...value,
                    days: toggle(value.days, day.id),
                  })
                }
              />
            ))}
          </FilterGroup>
        </div>

        <DrawerFooter>
          <Button
            variant="secondary"
            onClick={() =>
              onChange({ genres: [], platforms: [], statuses: [], days: [] })
            }
          >
            초기화
          </Button>
          <Button onClick={() => onOpenChange(false)}>적용하기</Button>
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
      <p className="text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
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
        "h-10 rounded-full px-3.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </button>
  );
}
