"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, LoaderCircle } from "lucide-react";
import { PlatformBadge } from "@/components/webtoon/PlatformBadge";
import { AnalysisProgressItem } from "@/components/onboarding/AnalysisProgressItem";
import { ANALYSIS_TRAITS, type Webtoon } from "@/types/webtoon";
import { cn } from "@/lib/utils";

type TasteAnalysisStepProps = {
  webtoon: Webtoon;
  onComplete: () => void;
};

export function TasteAnalysisStep({
  webtoon,
  onComplete,
}: TasteAnalysisStepProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const interval = reduceMotion ? 350 : 700;
    let current = 0;
    let finished = false;

    const timer = setInterval(() => {
      setCompleted((prev) => [...prev, current]);
      current += 1;
      setActiveIndex(current);

      if (current >= ANALYSIS_TRAITS.length && !finished) {
        finished = true;
        clearInterval(timer);
        setTimeout(() => onCompleteRef.current(), reduceMotion ? 200 : 500);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col px-5 pb-10 pt-8">
      <div className="mb-8 flex items-center gap-3">
        <motion.div
          layoutId={`selected-${webtoon.id}`}
          className="relative h-16 w-12 overflow-hidden rounded-xl bg-muted ring-1 ring-border"
        >
          {webtoon.thumb_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={webtoon.thumb_url}
              alt={webtoon.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute left-1 top-1 scale-75">
            <PlatformBadge platform={webtoon.platform} />
          </div>
        </motion.div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">선택한 작품</p>
          <p className="truncate text-[15px] font-medium">{webtoon.title}</p>
        </div>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        취향을 분석하고 있어요
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        작품의 분위기와 전개 방식을 살펴보고 있어요.
      </p>

      <ul className="mt-10 space-y-4">
        {ANALYSIS_TRAITS.map((trait, index) => {
          const isDone = completed.includes(index);
          const isActive = activeIndex === index && !isDone;
          const visible = isDone || isActive || index === 0;

          return (
            <motion.li
              key={trait}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={
                visible
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0.35, y: 0 }
              }
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  isDone ? "bg-toona-soft text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4" />
                ) : isActive ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-border" />
                )}
              </span>
              <AnalysisProgressItem
                label={trait}
                active={isActive || isDone}
                done={isDone}
              />
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
