"use client";

import { SiKakao, SiNaver } from "react-icons/si";
import { cn } from "@/lib/utils";
import {
  PLATFORM_BADGE_COLORS,
  PLATFORM_LABELS,
  type Platform,
} from "@/features/webtoons/model";

type PlatformBadgeProps = {
  platform: Platform;
  className?: string;
  variant?: "default" | "overlay" | "solid";
  size?: "xs" | "sm";
  /** Hide text label (icon only). Use "mobile" to show label from md+. */
  label?: "always" | "never" | "desktop";
};

function PlatformIcon({
  platform,
  className,
}: {
  platform: Platform;
  className?: string;
}) {
  if (platform === "naver") return <SiNaver className={className} aria-hidden />;
  return <SiKakao className={className} aria-hidden />;
}

export function PlatformBadge({
  platform,
  className,
  variant = "default",
  size = "xs",
  label: labelMode = "always",
}: PlatformBadgeProps) {
  const colors = PLATFORM_BADGE_COLORS[platform];
  const label = PLATFORM_LABELS[platform];
  const shortLabel = platform === "naver" ? "네이버" : "카카오";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-2.5 w-2.5";
  const textSize = size === "sm" ? "text-[11px]" : "text-[10px]";
  const iconOnly = labelMode === "never";
  const labelClass =
    labelMode === "desktop"
      ? "hidden md:inline"
      : labelMode === "never"
        ? "hidden"
        : "inline";
  const shapeClass =
    labelMode === "desktop"
      ? "gap-0 rounded-md p-1 md:gap-1 md:rounded-full md:px-1.5 md:py-0.5"
      : iconOnly
        ? "rounded-md p-1"
        : "gap-1 rounded-full px-1.5 py-0.5";
  const overlayShapeClass =
    labelMode === "desktop"
      ? "gap-0 rounded-md p-1 md:gap-1 md:rounded-md md:px-1.5 md:py-0.5"
      : iconOnly
        ? "rounded-md p-1"
        : "gap-1 rounded-md px-1.5 py-0.5";

  if (variant === "solid") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center whitespace-nowrap font-bold",
          shapeClass,
          textSize,
          className
        )}
        style={{ backgroundColor: colors.bg, color: colors.text }}
        aria-label={label}
      >
        <PlatformIcon platform={platform} className={cn("shrink-0", iconSize)} />
        <span className={cn(labelClass, "whitespace-nowrap")}>{shortLabel}</span>
      </span>
    );
  }

  if (variant === "overlay") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center whitespace-nowrap border border-white/20 bg-[#0F1014]/80 font-bold shadow-sm backdrop-blur-sm",
          overlayShapeClass,
          textSize,
          className
        )}
        style={{ color: colors.accent }}
        aria-label={label}
      >
        <PlatformIcon platform={platform} className={cn("shrink-0", iconSize)} />
        <span className={cn(labelClass, "whitespace-nowrap")}>{shortLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap font-bold",
        shapeClass,
        textSize,
        className
      )}
      style={{
        backgroundColor: `${colors.bg}33`,
        color: colors.accent,
        boxShadow: `inset 0 0 0 1px ${colors.bg}55`,
      }}
      aria-label={label}
    >
      <PlatformIcon platform={platform} className={cn("shrink-0", iconSize)} />
      <span className={cn(labelClass, "whitespace-nowrap")}>{label}</span>
    </span>
  );
}

export function GenreChip({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}
