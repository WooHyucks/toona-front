"use client";

import {
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** API error code for icon/copy defaults */
  code?: string | null;
  icon?: LucideIcon;
  className?: string;
  fullPage?: boolean;
};

function defaultsForCode(code?: string | null): {
  title: string;
  description: string;
  icon: LucideIcon;
} {
  if (code === "untagged") {
    return {
      title: "이 작품은 아직 추천 준비 중이에요",
      description: "다른 작품을 골라주세요.",
      icon: AlertTriangle,
    };
  }
  if (code === "not_found") {
    return {
      title: "최근 선택한 작품을 찾을 수 없어요",
      description: "다른 작품을 골라주세요.",
      icon: Search,
    };
  }
  if (code === "analysis_failed") {
    return {
      title: "취향을 분석하지 못했어요",
      description: "잠시 후 다시 시도하거나 다른 작품을 골라 주세요.",
      icon: AlertCircle,
    };
  }
  if (code === "db_error" || code === "internal_error") {
    return {
      title: "잠시 후 다시 시도해주세요",
      description: "서버에 잠깐 문제가 생겼어요. 다시 시도해 주세요.",
      icon: AlertCircle,
    };
  }
  return {
    title: "잠시 문제가 생겼어요",
    description: "다시 시도해 주세요.",
    icon: AlertCircle,
  };
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "다시 시도",
  secondaryAction,
  code,
  icon,
  className,
  fullPage = false,
}: ErrorStateProps) {
  const defaults = defaultsForCode(code);
  const Icon = icon ?? defaults.icon;
  const canRetry =
    Boolean(onRetry) &&
    code !== "untagged" &&
    code !== "not_found";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-5 text-center",
        fullPage ? "min-h-[100dvh] py-10" : "py-14",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card ring-1 ring-border">
        <Icon className="h-6 w-6 text-primary" aria-hidden />
      </div>
      <div className="max-w-sm space-y-2">
        <p className="text-[17px] font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-[18px]">
          {title ?? defaults.title}
        </p>
        <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-[14px]">
          {description ?? defaults.description}
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2.5 sm:max-w-sm sm:flex-row sm:justify-center">
        {secondaryAction ? (
          <Button
            type="button"
            className="min-h-12 w-full rounded-2xl text-[14px] sm:flex-1"
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
        ) : null}
        {canRetry ? (
          <Button
            type="button"
            variant={secondaryAction ? "secondary" : "default"}
            className="min-h-12 w-full rounded-2xl text-[14px] sm:flex-1"
            onClick={onRetry}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            {retryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
