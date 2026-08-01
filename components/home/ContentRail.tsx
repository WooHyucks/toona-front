"use client";

import {
  SectionHeader,
  WebtoonCarousel,
} from "@/components/home/WebtoonCarousel";
import type { Webtoon } from "@/types/webtoon";

type ContentRailProps = {
  title: string;
  webtoons: Webtoon[];
  href?: string;
  onOpen: (webtoon: Webtoon) => void;
};

export function ContentRail({
  title,
  webtoons,
  href = "/search",
  onOpen,
}: ContentRailProps) {
  if (webtoons.length === 0) return null;

  return (
    <section className="space-y-0">
      <SectionHeader title={title} href={href} />
      <WebtoonCarousel webtoons={webtoons} onOpen={onOpen} />
    </section>
  );
}
