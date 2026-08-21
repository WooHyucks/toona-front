"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast, useToast } from "@/components/common/Toast";
import { addLifetimeWebtoon } from "@/lib/api/lifetime-webtoons";
import { trackLifetimeCollectionCreated } from "@/lib/analytics";
import { completeOnboarding, getSessionId } from "@/lib/session";

type CreateLifetimeCollectionCtaProps = {
  sourceWebtoonId: string;
  sourceTitle: string;
  onSkipHome: () => void;
  skipLabel: string;
};

export function CreateLifetimeCollectionCta({
  sourceWebtoonId,
  sourceTitle,
  onSkipHome,
  skipLabel,
}: CreateLifetimeCollectionCtaProps) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function createCollection() {
    if (busy || !sourceWebtoonId) return;
    setBusy(true);
    try {
      const sessionId = getSessionId();
      const res = await addLifetimeWebtoon({
        sessionId,
        webtoonId: sourceWebtoonId,
        source: "RECOMMENDATION",
      });
      completeOnboarding(sourceWebtoonId, sourceTitle);
      if (!res.alreadyExists) {
        trackLifetimeCollectionCreated(sourceWebtoonId, sourceTitle);
      }
      try {
        sessionStorage.setItem("toona_lifetime_just_created", "1");
      } catch {
        /* ignore */
      }
      router.push("/home");
    } catch {
      showToast("보관함을 만들지 못했어요. 다시 시도해주세요.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-card px-4 py-5">
      <p className="text-[15px] font-semibold text-foreground">
        재밌게 본 웹툰, 하나씩 모아보세요.
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        {sourceTitle}을 첫 번째 인생 웹툰으로 담아둘게요.
      </p>
      <Button
        type="button"
        className="mt-4 min-h-12 w-full rounded-2xl text-[15px] font-semibold"
        disabled={busy}
        onClick={() => void createCollection()}
      >
        {busy ? "보관함 만드는 중…" : "내 인생 웹툰 보관함 만들기"}
        {!busy ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
      </Button>
      <button
        type="button"
        disabled={busy}
        onClick={onSkipHome}
        className="mt-2 w-full py-1.5 text-[12px] text-muted-foreground/70 hover:text-muted-foreground disabled:opacity-40"
      >
        {skipLabel}
      </button>
      <Toast message={toast} />
    </div>
  );
}
