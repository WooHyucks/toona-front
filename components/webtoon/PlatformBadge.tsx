"use client";

import { SiKakao, SiNaver } from "react-icons/si";
import { cn } from "@/lib/utils";

type PlatformBadgeProps = {
  platform: string;
  className?: string;
  size?: "sm" | "md";
};

export function PlatformBadge({
  platform,
  className,
  size = "sm",
}: PlatformBadgeProps) {
  const normalized = platform.toLowerCase();
  const isNaver = normalized === "naver";
  const isKakao = normalized === "kakao";

  const label = isNaver ? "네이버웹툰" : isKakao ? "카카오웹툰" : platform;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full shadow-sm",
        size === "sm" ? "h-6 w-6" : "h-7 w-7",
        isNaver && "bg-[#00D564] text-[#071A0D]",
        isKakao && "bg-[#FFD400] text-[#181000]",
        !isNaver && !isKakao && "bg-[#22232B] text-[#F5F5F7]",
        className
      )}
      aria-label={label}
    >
      {isNaver ? (
        <SiNaver className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      ) : isKakao ? (
        <SiKakao className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      ) : (
        <span className="text-[10px] font-bold">
          {platform.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}
