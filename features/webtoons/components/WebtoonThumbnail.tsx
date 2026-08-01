"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, type Platform } from "@/features/webtoons/model";

const FALLBACK_PALETTES = [
  ["#1a1625", "#3b2f5c"],
  ["#151a22", "#2a3a4a"],
  ["#1c1814", "#3d3428"],
  ["#14181c", "#2c3640"],
  ["#1a1420", "#4a2f6b"],
  ["#12181a", "#1f3d3a"],
] as const;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickPalette(seed: string): readonly [string, string] {
  return FALLBACK_PALETTES[hashString(seed) % FALLBACK_PALETTES.length];
}

type WebtoonThumbnailProps = {
  src?: string | null;
  title: string;
  platform: Platform;
  priority?: boolean;
  sizes?: string;
  className?: string;
  seed?: string;
};

export function WebtoonThumbnail({
  src,
  title,
  platform,
  priority = false,
  sizes,
  className,
  seed,
}: WebtoonThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const [from, to] = pickPalette(seed ?? title);

  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-elevated",
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={title}
          sizes={sizes}
          referrerPolicy="no-referrer"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col justify-between p-2.5"
          style={{
            background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)`,
          }}
          aria-hidden={!title}
        >
          <span className="text-[10px] font-semibold text-white/70">
            {PLATFORM_LABELS[platform]}
          </span>
          <p className="line-clamp-3 text-[12px] font-semibold leading-snug text-white">
            {title}
          </p>
        </div>
      )}
    </div>
  );
}
