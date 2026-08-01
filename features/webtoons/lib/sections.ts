import type { Webtoon } from "@/features/webtoons/model";
import type { SectionIconId } from "@/features/ui/SectionIcon";
import {
  DAY_LABEL,
  GENRE_LABELS,
  STATUS_LABELS,
  getSeoulDayOfWeek,
} from "@/features/webtoons/model";

export type HomeSection = {
  id: string;
  icon: SectionIconId;
  title: string;
  items: Webtoon[];
};

export function buildHomeSections(webtoons: Webtoon[]): HomeSection[] {
  const today = getSeoulDayOfWeek();

  const sections: HomeSection[] = [
    {
      id: "trending",
      icon: "trending",
      title: "지금 인기 있는 웹툰",
      items: [...webtoons].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)).slice(0, 24),
    },
    {
      id: "for-you",
      icon: "for-you",
      title: "당신이 좋아할 작품",
      items: [...webtoons].reverse().slice(0, 24),
    },
    {
      id: "today",
      icon: "today",
      title: "오늘 연재되는 웹툰",
      items: webtoons.filter((w) => w.daysOfWeek.includes(today)).slice(0, 24),
    },
    {
      id: "fantasy",
      icon: "fantasy",
      title: "판타지 인기작",
      items: webtoons.filter((w) => w.primaryGenre === "Fantasy").slice(0, 24),
    },
    {
      id: "romance",
      icon: "romance",
      title: "로맨스 인기작",
      items: webtoons.filter((w) => w.primaryGenre === "Romance").slice(0, 24),
    },
    {
      id: "completed",
      icon: "completed",
      title: "완결작 정주행",
      items: webtoons.filter((w) => w.status === "completed").slice(0, 24),
    },
    {
      id: "naver",
      icon: "naver",
      title: "네이버 인기작",
      items: webtoons.filter((w) => w.platform === "naver").slice(0, 24),
    },
    {
      id: "kakao",
      icon: "kakao",
      title: "카카오 인기작",
      items: webtoons.filter((w) => w.platform === "kakao").slice(0, 24),
    },
  ];

  return sections.filter((s) => s.items.length > 0);
}

export function getGenreLabels(webtoon: Webtoon): string[] {
  return webtoon.genres.map((g) => GENRE_LABELS[g]);
}

export function getStatusLabel(webtoon: Webtoon): string {
  if (!webtoon.status) return STATUS_LABELS.ongoing;
  return STATUS_LABELS[webtoon.status];
}

export function getDayLabels(webtoon: Webtoon): string[] {
  return webtoon.daysOfWeek.map((d) => DAY_LABEL[d]);
}
