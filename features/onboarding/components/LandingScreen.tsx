"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Compass, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";
import { ToonaLogo } from "@/components/brand/ToonaLogo";

export function LandingScreen() {
  const router = useRouter();

  return (
    <motion.div
      className="flex min-h-[100dvh] flex-col bg-background md:mx-auto md:max-w-lg lg:max-w-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -40 }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <motion.div
          className="mb-10 flex flex-col items-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260 }}
        >
          <ToonaLogo size="xl" priority className="mb-5 object-center mx-auto" />
          <h1 className="mt-2 text-[22px] font-bold leading-snug tracking-[-0.02em] text-foreground">
            가장 재밌게 본 웹툰
            <br />
            하나를 선택해주세요
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            비슷한 취향의 다음 작품을 골라드릴게요.
          </p>
        </motion.div>

        <motion.div
          className="mb-12 flex w-full max-w-[320px] flex-col gap-4 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {[
            {
              icon: Sparkles,
              title: "취향 한 번에 파악",
              sub: "좋아하는 작품 하나로 맞춤 추천",
            },
            {
              icon: Compass,
              title: "네이버·카카오 통합",
              sub: "흩어진 작품을 한곳에서 고르기",
            },
            {
              icon: Target,
              title: "바로 이어보기",
              sub: "완결작·연재작으로 나눠 추천",
            },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">
                  {title}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="px-6 pb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <button
          type="button"
          onClick={() => router.push("/onboarding/select")}
          className="flex w-full min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          작품 고르기
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
