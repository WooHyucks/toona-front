"use client";

import { useRouter } from "next/navigation";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prepareTasteAnalysis } from "@/lib/taste-flow";
import type { TasteSourceOrigin } from "@/lib/recentTasteSource";

type StartSimilarAnalysisButtonProps = {
  webtoonId: string;
  title: string;
  thumbnailUrl?: string | null;
  platform?: string | null;
  origin: TasteSourceOrigin;
  source?: string;
  label?: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
};

export function StartSimilarAnalysisButton({
  webtoonId,
  title,
  thumbnailUrl,
  platform,
  origin,
  source,
  label = "이 작품과 비슷한 웹툰 찾기",
  variant = "secondary",
  className = "h-12 w-full",
}: StartSimilarAnalysisButtonProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => {
        router.push(
          prepareTasteAnalysis(webtoonId, title, {
            origin,
            source: source ?? origin.toLowerCase(),
            thumbnailUrl,
            platform,
          })
        );
      }}
    >
      <WandSparkles className="h-4 w-4" />
      {label}
    </Button>
  );
}
