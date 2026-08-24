"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { ToonaInstagramLink } from "@/components/brand/ToonaInstagramLink";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { DesktopContent, DesktopPageHeader } from "@/features/shell/DesktopContent";

const SETTINGS = [
  "알림 설정",
  "보기 설정",
  "플랫폼 연동",
  "피드백 보내기",
  "서비스 정보",
];

export function ProfileScreen() {
  const router = useRouter();
  const { resetOnboarding, sourceId, recommendationIds } = useOnboardingStatus();

  const tasteTags = ["판타지", "액션", "완결작"];

  return (
    <div className="pb-10 md:pb-16">
      <DesktopContent>
        <DesktopPageHeader title="프로필" description="취향 분석과 앱 설정을 관리하세요" />

        <div className="md:grid md:grid-cols-2 md:items-start md:gap-6 lg:gap-8">
          <div className="mb-4 rounded-2xl border border-border bg-card p-5 md:mb-0 lg:p-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              내 취향 분석
            </p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {tasteTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-3 py-1 text-[12px] font-medium text-primary md:text-[13px]"
                  style={{ backgroundColor: "rgba(95,52,254,0.2)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
            {sourceId ? (
              <p className="mb-3 text-[12px] text-muted-foreground md:text-[13px]">
                기준 작품 · 추천 {recommendationIds.length}편
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                resetOnboarding();
                router.push("/onboarding");
              }}
              className="flex items-center gap-1.5 text-[13px] font-medium text-primary md:text-[14px]"
            >
              취향 다시 분석하기
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {SETTINGS.map((item) => (
              <button
                key={item}
                type="button"
                className="flex items-center justify-between rounded-xl bg-card px-4 py-3.5 transition-colors hover:bg-elevated md:px-5 md:py-4"
              >
                <span className="text-[14px] text-foreground md:text-[15px]">{item}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 md:mt-10">
          <ToonaInstagramLink className="h-11 w-11 rounded-xl bg-card" />
          <Link
            href="/onboarding"
            className="block text-center text-[12px] text-muted-foreground md:text-[13px]"
          >
            온보딩 다시 보기
          </Link>
        </div>
      </DesktopContent>
    </div>
  );
}
